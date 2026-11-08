import "server-only";
import { z } from "zod";
import { db, type Tx } from "@/lib/db";
import { badRequest } from "@/lib/http";
import { num } from "@/lib/money";
import { carritoSchema, itemCarritoSchema } from "@/server/schemas";

export type ItemEntrada = z.output<typeof itemCarritoSchema>;

export interface LineaResuelta extends ItemEntrada {
  nombre: string;
  precio: number;
  imagenUrl: string | null;
  tiempoEntrega: number;
  idEstilo: number | null;
  estiloEtiqueta: string | null;
}

/**
 * Valida cada ítem contra la BD y fija el precio con el valor VIGENTE del catálogo.
 * Nunca se confía en el precio que envía el navegador.
 */
export async function resolverItems(items: ItemEntrada[], tx: Tx | typeof db = db): Promise<LineaResuelta[]> {
  const ids = [...new Set(items.map((i) => i.idServicio))];
  const servicios = await tx.servicioProducto.findMany({ where: { idServicio: { in: ids } }, include: { opcionProductos: true } });
  const estilos = await tx.estiloDiseno.findMany();
  const porId = new Map(servicios.map((s) => [s.idServicio, s]));
  return items.map((it) => {
    const s = porId.get(it.idServicio);
    if (!s) throw badRequest(`El producto ${it.idServicio} ya no existe.`);
    if (s.estado !== "DISPONIBLE") throw badRequest(`"${s.nombre}" no está disponible actualmente.`);
    const tallas = s.opcionProductos.filter((o) => o.tipo === "TALLA").map((o) => o.valor);
    const mats = s.opcionProductos.filter((o) => o.tipo === "MATERIAL").map((o) => o.valor);
    if (it.talla && tallas.length && !tallas.includes(it.talla)) throw badRequest(`Talla "${it.talla}" no válida para ${s.nombre}.`);
    if (it.material && mats.length && !mats.includes(it.material)) throw badRequest(`Material "${it.material}" no válido para ${s.nombre}.`);
    const est = it.estilo ? estilos.find((e) => e.codigo === it.estilo) : undefined;
    if (it.estilo && !est) throw badRequest(`Estilo de diseño "${it.estilo}" no válido.`);
    return {
      ...it, nombre: s.nombre, precio: num(s.precio), imagenUrl: s.imagenUrl, tiempoEntrega: s.tiempoEntrega,
      idEstilo: est?.idEstilo ?? null, estiloEtiqueta: est?.etiqueta ?? null,
    };
  });
}

async function carritoAbierto(tx: Tx | typeof db, idCliente: number) {
  return (
    (await tx.carrito.findFirst({ where: { idCliente, estado: "ABIERTO" } })) ??
    (await tx.carrito.create({ data: { idCliente } }))
  );
}

function aItems(rows: Awaited<ReturnType<typeof leerFilas>>) {
  return rows.map((r) => ({
    idServicio: r.idServicio, nombre: r.servicioProducto.nombre, precio: num(r.servicioProducto.precio),
    imagenUrl: r.servicioProducto.imagenUrl, cantidad: r.cantidad, talla: r.talla, material: r.material,
    colorHex: r.colorHex?.trim() ?? null, estilo: r.estiloDiseno?.codigo ?? null, archivoDiseno: r.archivoDiseno, notas: r.notas,
  }));
}
const leerFilas = (idCarrito: number) =>
  db.itemCarrito.findMany({ where: { idCarrito }, include: { servicioProducto: true, estiloDiseno: true }, orderBy: { idItem: "asc" } });

export async function obtenerCarrito(idCliente: number) {
  const c = await db.carrito.findFirst({ where: { idCliente, estado: "ABIERTO" } });
  return c ? aItems(await leerFilas(c.idCarrito)) : [];
}

/** Reemplaza el contenido del carrito persistido (sincronización desde el navegador). */
export async function guardarCarrito(idCliente: number, data: unknown) {
  const { items } = carritoSchema.parse(data);
  // ítems de productos que ya no existen o no están disponibles se descartan en silencio al sincronizar
  const validos = await db.servicioProducto.findMany({ where: { idServicio: { in: items.map((i) => i.idServicio) }, estado: "DISPONIBLE" }, select: { idServicio: true } });
  const okIds = new Set(validos.map((v) => v.idServicio));
  const filtrados = items.filter((i) => okIds.has(i.idServicio));
  const lineas = await resolverItems(filtrados);
  await db.$transaction(async (tx) => {
    const c = await carritoAbierto(tx, idCliente);
    await tx.itemCarrito.deleteMany({ where: { idCarrito: c.idCarrito } });
    if (lineas.length)
      await tx.itemCarrito.createMany({
        data: lineas.map((l) => ({
          idCarrito: c.idCarrito, idServicio: l.idServicio, cantidad: l.cantidad, talla: l.talla, material: l.material,
          colorHex: l.colorHex, idEstilo: l.idEstilo, archivoDiseno: l.archivoDiseno, notas: l.notas,
        })),
      });
    await tx.carrito.update({ where: { idCarrito: c.idCarrito }, data: {} });
  });
  return obtenerCarrito(idCliente);
}

export const claveItem = (i: Pick<ItemEntrada, "idServicio" | "talla" | "material" | "colorHex" | "estilo" | "archivoDiseno">) =>
  [i.idServicio, i.talla ?? "", i.material ?? "", i.colorHex ?? "", i.estilo ?? "", i.archivoDiseno ?? ""].join("|");

/** Al iniciar sesión: une el carrito del navegador (invitado) con el guardado en BD, sumando cantidades iguales. */
export async function fusionarCarrito(idCliente: number, data: unknown) {
  const { items: locales } = carritoSchema.parse(data);
  const guardados = await obtenerCarrito(idCliente);
  const mapa = new Map<string, ItemEntrada>();
  for (const it of [...guardados.map((g) => ({ ...g, estilo: g.estilo })), ...locales] as ItemEntrada[]) {
    const k = claveItem(it);
    const prev = mapa.get(k);
    mapa.set(k, prev ? { ...prev, cantidad: Math.min(99, prev.cantidad + it.cantidad) } : it);
  }
  return guardarCarrito(idCliente, { items: [...mapa.values()] });
}
