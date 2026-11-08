import "server-only";
import { z } from "zod";
import { db, igualCI } from "@/lib/db";
import { abrirSesion, bloqueado, hashPassword, limpiarFallos, registrarFallo, verificarPassword, type RolNombre } from "@/lib/auth";
import { ApiError, badRequest, conflict, notFound } from "@/lib/http";
import { loginSchema, registroSchema, usuarioActualizarSchema, usuarioCrearSchema } from "@/server/schemas";
import { usuarioDTO } from "@/server/dto";
import { correoBienvenida } from "@/server/mail/correos";

const INC = { usuarioRols: { include: { rol: true } }, cliente: true, administrador: true } as const;

async function rolId(nombre: RolNombre) {
  const r = await db.rol.findUnique({ where: { nombre } });
  if (!r) throw new ApiError(500, `Falta el rol ${nombre}. Ejecuta db/02_seed.sql.`);
  return r.idRol;
}

async function exigirEmailLibre(email: string, excluir?: number) {
  const e = await db.usuario.findFirst({ where: { email: igualCI(email), ...(excluir ? { NOT: { idUsuario: excluir } } : {}) } });
  if (e) throw conflict("Ya existe una cuenta con ese correo electrónico. Intenta iniciar sesión.");
}

/** Registro público: SIEMPRE crea un CLIENTE (no hay campo rol, igual que RegistroRequestDTO). */
export async function registrar(data: unknown) {
  const d = registroSchema.parse(data);
  await exigirEmailLibre(d.email);
  const password_hash = await hashPassword(d.password);
  const idRol = await rolId("CLIENTE");
  const u = await db.usuario.create({
    data: {
      nombre: d.nombre,
      apellido: d.apellido,
      email: d.email,
      telefono: d.telefono,
      passwordHash: password_hash,
      aceptaTerminosAt: new Date(),
      usuarioRols: { create: { idRol } },
      cliente: { create: { direccion: d.direccion } },
    },
    include: INC,
  });
  const dto = usuarioDTO(u);
  await abrirSesion(u.idUsuario, dto.roles as RolNombre[]);
  correoBienvenida({ idUsuario: u.idUsuario, nombre: u.nombre, email: u.email });
  return dto;
}

export async function iniciarSesion(data: unknown, ip: string, rolEsperado?: "CLIENTE" | "ADMINISTRADOR") {
  const { email, password } = loginSchema.parse(data);
  const clave = `${ip}|${email}`;
  if (bloqueado(clave)) throw new ApiError(429, "Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.");
  const u = await db.usuario.findFirst({ where: { email: igualCI(email) }, include: INC });
  // Mensaje genérico: no revela si el correo existe
  const valido = u ? await verificarPassword(password, u.passwordHash) : false;
  if (!u || !valido) {
    registrarFallo(clave);
    throw new ApiError(401, "Correo o contraseña incorrectos.");
  }
  if (u.estado !== "ACTIVO") throw new ApiError(403, "Tu cuenta está bloqueada. Contacta al administrador.");
  const dto = usuarioDTO(u);
  if (rolEsperado === "ADMINISTRADOR" && !dto.roles.includes("ADMINISTRADOR"))
    throw new ApiError(403, "Esta cuenta no tiene permisos de administrador.");
  limpiarFallos(clave);
  await db.usuario.update({ where: { idUsuario: u.idUsuario }, data: { ultimoLogin: new Date() } });
  await abrirSesion(u.idUsuario, dto.roles as RolNombre[]);
  return dto;
}

export async function obtenerUsuario(id: number) {
  const u = await db.usuario.findUnique({ where: { idUsuario: id }, include: INC });
  if (!u) throw notFound(`Usuario no encontrado con id ${id}`);
  return usuarioDTO(u);
}

export async function listarUsuarios() {
  const rows = await db.usuario.findMany({ include: INC, orderBy: { idUsuario: "asc" } });
  return rows.map(usuarioDTO);
}

/** Alta por un administrador: cualquier rol. */
export async function crearUsuario(data: unknown) {
  const d = usuarioCrearSchema.parse(data);
  await exigirEmailLibre(d.email);
  const idRol = await rolId(d.rol);
  const u = await db.usuario.create({
    data: {
      nombre: d.nombre,
      apellido: d.apellido,
      email: d.email,
      telefono: d.telefono,
      passwordHash: await hashPassword(d.password),
      aceptaTerminosAt: d.rol === "CLIENTE" ? null : new Date(),
      usuarioRols: { create: { idRol } },
      ...(d.rol === "CLIENTE" ? { cliente: { create: { direccion: d.direccion } } } : {}),
      ...(d.rol === "ADMINISTRADOR" ? { administrador: { create: { cargo: d.cargo } } } : {}),
    },
    include: INC,
  });
  return usuarioDTO(u);
}

export async function actualizarUsuario(id: number, data: unknown, idActor: number) {
  const d = usuarioActualizarSchema.parse(data);
  const actual = await db.usuario.findUnique({ where: { idUsuario: id }, include: INC });
  if (!actual) throw notFound(`Usuario no encontrado con id ${id}`);
  if (id === idActor && d.estado === "BLOQUEADO") throw badRequest("No puedes bloquear tu propia cuenta.");
  await assertQuedaAdmin(actual, d.estado === "BLOQUEADO");
  const u = await db.usuario.update({
    where: { idUsuario: id },
    data: {
      nombre: d.nombre,
      apellido: d.apellido,
      telefono: d.telefono,
      estado: d.estado,
      ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
    },
    include: INC,
  });
  return usuarioDTO(u);
}

export async function eliminarUsuario(id: number, idActor: number) {
  const actual = await db.usuario.findUnique({ where: { idUsuario: id }, include: { ...INC, cliente: { include: { _count: { select: { pedidos: true } } } } } });
  if (!actual) throw notFound(`Usuario no encontrado con id ${id}`);
  if (id === idActor) throw badRequest("No puedes eliminar tu propia cuenta.");
  await assertQuedaAdmin(actual, true);
  if ((actual.cliente?._count.pedidos ?? 0) > 0)
    throw conflict("El usuario tiene pedidos registrados; por trazabilidad contable no se elimina. Bloquéalo en su lugar.");
  await db.usuario.delete({ where: { idUsuario: id } });
}

/** Garantiza que siempre quede al menos un administrador activo. */
async function assertQuedaAdmin(u: { idUsuario: number; usuarioRols: { rol: { nombre: string } }[] }, seDeshabilita: boolean) {
  if (!seDeshabilita || !u.usuarioRols.some((r) => r.rol.nombre === "ADMINISTRADOR")) return;
  const otros = await db.usuario.count({
    where: { estado: "ACTIVO", NOT: { idUsuario: u.idUsuario }, usuarioRols: { some: { rol: { nombre: "ADMINISTRADOR" } } } },
  });
  if (otros === 0) throw conflict("Debe existir al menos un administrador activo.");
}

/** Perfil del cliente (datos que prellenan el checkout). */
export async function perfilCliente(idUsuario: number) {
  const u = await db.usuario.findUnique({ where: { idUsuario }, include: INC });
  if (!u) throw notFound("Usuario no encontrado.");
  return {
    ...usuarioDTO(u),
    tipoDocumento: u.cliente?.tipoDocumento ?? null,
    numeroDocumento: u.cliente?.numeroDocumento ?? null,
    ciudad: u.cliente?.ciudad ?? null,
    departamento: u.cliente?.departamento ?? null,
  };
}

