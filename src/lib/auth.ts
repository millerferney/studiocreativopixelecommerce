import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/http";

export type RolNombre = "CLIENTE" | "ADMINISTRADOR" | "DISENADOR";
export const COOKIE = "scp_session";

const horas = Number(process.env.SESSION_HOURS ?? 8);

function secreto() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET debe tener al menos 32 caracteres (openssl rand -base64 48)");
  return new TextEncoder().encode(s);
}

// BCrypt: los hashes $2a/$2b son compatibles con BCryptPasswordEncoder de Spring Security.
export const hashPassword = (plano: string) => bcrypt.hash(plano, 10);
export const verificarPassword = (plano: string, hash: string) => bcrypt.compare(plano, hash);

export async function firmarToken(idUsuario: number, roles: RolNombre[]) {
  return new SignJWT({ roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(idUsuario))
    .setIssuedAt()
    .setExpirationTime(`${horas}h`)
    .sign(secreto());
}

export async function leerToken(token: string): Promise<{ id: number; roles: RolNombre[] } | null> {
  try {
    const { payload } = await jwtVerify(token, secreto(), { algorithms: ["HS256"] });
    return { id: Number(payload.sub), roles: (payload.roles as RolNombre[]) ?? [] };
  } catch {
    return null;
  }
}

export async function abrirSesion(idUsuario: number, roles: RolNombre[]) {
  const token = await firmarToken(idUsuario, roles);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: horas * 3600,
  });
  return token;
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export interface UsuarioSesion {
  idUsuario: number;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  estado: string;
  roles: RolNombre[];
}

/** Usuario actual leído de la BD (fuente de verdad: respeta bloqueos y cambios de rol al instante). */
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const t = await leerToken(token);
  if (!t) return null;
  const u = await db.usuario.findUnique({
    where: { idUsuario: t.id },
    include: { usuarioRols: { include: { rol: true } } },
  });
  if (!u || u.estado !== "ACTIVO") return null;
  return {
    idUsuario: u.idUsuario,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono,
    estado: u.estado,
    roles: u.usuarioRols.map((r) => r.rol.nombre as RolNombre),
  };
}

export async function requerirUsuario(...roles: RolNombre[]): Promise<UsuarioSesion> {
  const u = await usuarioActual();
  if (!u) throw unauthorized();
  if (roles.length && !roles.some((r) => u.roles.includes(r))) throw forbidden();
  return u;
}

// ── Límite de intentos de login (en memoria por instancia; en producción usar Upstash/Redis) ──
const intentos = new Map<string, { n: number; hasta: number }>();
export function registrarFallo(clave: string) {
  const ahora = Date.now();
  const r = intentos.get(clave);
  if (!r || r.hasta < ahora) intentos.set(clave, { n: 1, hasta: ahora + 15 * 60_000 });
  else r.n++;
}
export const limpiarFallos = (clave: string) => intentos.delete(clave);
export function bloqueado(clave: string) {
  const r = intentos.get(clave);
  return !!r && r.hasta > Date.now() && r.n >= 5;
}
