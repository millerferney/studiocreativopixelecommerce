import "server-only";
import { z } from "zod";
import { contieneCI, db, igualCI } from "@/lib/db";
import { conflict, notFound } from "@/lib/http";
import { categoriaSchema, servicioSchema } from "@/server/schemas";
import { servicioDTO } from "@/server/dto";

const INC = { categoria: true, opcionProductos: true } as const;

// ── Categorías ──
export async function listarCategorias() {
  const cats = await db.categoria.findMany({
    orderBy: { idCategoria: "asc" },
    include: { _count: { select: { servicioProductos: true } } },
  });
  return cats.map((c) => ({ idCategoria: c.idCategoria, nombre: c.nombre, descripcion: c.descripcion, totalServicios: c._count.servicioProductos }));
}

export async function crearCategoria(data: z.input<typeof categoriaSchema>) {
  const d = categoriaSchema.parse(data);
  const existe = await db.categoria.findFirst({ where: { nombre: igualCI(d.nombre) } });
  if (existe) throw conflict(`Ya existe una categoría llamada "${d.nombre}".`);
  const c = await db.categoria.create({ data: d });
  return { idCategoria: c.idCategoria, nombre: c.nombre, descripcion: c.descripcion, totalServicios: 0 };
}

export async function actualizarCategoria(id: number, data: z.input<typeof categoriaSchema>) {
  const d = categoriaSchema.parse(data);
  const actual = await db.categoria.findUnique({ where: { idCategoria: id } });
  if (!actual) throw notFound(`Categoría no encontrada con id ${id}`);
  const dup = await db.categoria.findFirst({ where: { nombre: igualCI(d.nombre), NOT: { idCategoria: id } } });
  if (dup) throw conflict(`Ya existe una categoría llamada "${d.nombre}".`);
  const c = await db.categoria.update({ where: { idCategoria: id }, data: d, include: { _count: { select: { servicioProductos: true } } } });
  return { idCategoria: c.idCategoria, nombre: c.nombre, descripcion: c.descripcion, totalServicios: c._count.servicioProductos };
}

export async function eliminarCategoria(id: number) {
  const c = await db.categoria.findUnique({ where: { idCategoria: id }, include: { _count: { select: { servicioProductos: true } } } });
  if (!c) throw notFound(`Categoría no encontrada con id ${id}`);
  if (c._count.servicioProductos > 0)
    throw conflict(`No se puede eliminar: la categoría "${c.nombre}" tiene ${c._count.servicioProductos} servicio(s)/producto(s) asociados.`);
  await db.categoria.delete({ where: { idCategoria: id } });
}

// ── Servicios / productos ──
export interface FiltrosServicio {
  idCategoria?: number;
  soloDisponibles?: boolean;
  orden?: "asc" | "desc";
  destacados?: boolean;
  q?: string;
}

export async function listarServicios(f: FiltrosServicio = {}) {
  const rows = await db.servicioProducto.findMany({
    where: {
      ...(f.idCategoria ? { idCategoria: f.idCategoria } : {}),
      ...(f.soloDisponibles ? { estado: "DISPONIBLE" } : {}),
      ...(f.destacados ? { destacado: true } : {}),
      ...(f.q ? { OR: [{ nombre: contieneCI(f.q) }, { descripcion: contieneCI(f.q) }] } : {}),
    },
    include: INC,
    orderBy: f.orden ? { precio: f.orden } : { idServicio: "asc" },
  });
  return rows.map(servicioDTO);
}

export async function obtenerServicio(id: number) {
  const s = await db.servicioProducto.findUnique({ where: { idServicio: id }, include: INC });
  if (!s) throw notFound(`Servicio/producto no encontrado con id ${id}`);
  return servicioDTO(s);
}

async function exigirCategoria(id: number) {
  const c = await db.categoria.findUnique({ where: { idCategoria: id } });
  if (!c) throw notFound(`Categoría no encontrada con id ${id}`);
}

function opcionesData(d: z.output<typeof servicioSchema>) {
  return [
    ...(d.tallas ?? []).map((valor, i) => ({ tipo: "TALLA", valor, orden: i + 1 })),
    ...(d.materiales ?? []).map((valor, i) => ({ tipo: "MATERIAL", valor, orden: i + 1 })),
  ];
}

export async function crearServicio(data: unknown) {
  const d = servicioSchema.parse(data);
  await exigirCategoria(d.idCategoria);
  const { tallas: _t, materiales: _m, ...base } = d;
  const s = await db.servicioProducto.create({
    data: { ...base, opcionProductos: { create: opcionesData(d) } },
    include: INC,
  });
  return servicioDTO(s);
}

export async function actualizarServicio(id: number, data: unknown) {
  const d = servicioSchema.parse(data);
  const actual = await db.servicioProducto.findUnique({ where: { idServicio: id } });
  if (!actual) throw notFound(`Servicio/producto no encontrado con id ${id}`);
  await exigirCategoria(d.idCategoria);
  const { tallas, materiales, ...base } = d;
  const s = await db.$transaction(async (tx) => {
    // Solo se reemplazan las opciones si el formulario las envió (el panel Vue original no las manejaba)
    if (tallas || materiales) {
      await tx.opcionProducto.deleteMany({ where: { idServicio: id } });
      await tx.opcionProducto.createMany({ data: opcionesData(d).map((o) => ({ ...o, idServicio: id })) });
    }
    return tx.servicioProducto.update({ where: { idServicio: id }, data: base, include: INC });
  });
  return servicioDTO(s);
}

export async function eliminarServicio(id: number) {
  const s = await db.servicioProducto.findUnique({
    where: { idServicio: id },
    include: { _count: { select: { detallePedidos: true } } },
  });
  if (!s) throw notFound(`Servicio/producto no encontrado con id ${id}`);
  if (s._count.detallePedidos > 0)
    throw conflict(`"${s.nombre}" ya fue vendido en ${s._count.detallePedidos} pedido(s). Márcalo como NO_DISPONIBLE en lugar de eliminarlo.`);
  await db.servicioProducto.delete({ where: { idServicio: id } });
}

export async function listarColores() {
  const c = await db.colorPaleta.findMany({ orderBy: { orden: "asc" } });
  return c.map((x) => ({ nombre: x.nombre, hex: x.hex.trim() }));
}
export async function listarEstilos() {
  const e = await db.estiloDiseno.findMany({ orderBy: { orden: "asc" } });
  return e.map((x) => ({ id: x.codigo, label: x.etiqueta, desc: x.descripcion ?? "", icon: x.icono ?? "" }));
}
