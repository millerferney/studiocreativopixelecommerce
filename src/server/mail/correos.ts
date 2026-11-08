import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db";
import { num } from "@/lib/money";
import { enviarMensaje, nombreProveedor, type Adjunto, type ResultadoEnvio } from "./proveedor";
import { MUESTRA, PLANTILLAS, type DatosPedido, type NombrePlantilla } from "./plantillas";

/**
 * Servicio de correos transaccionales. Cada envío:
 *  1) se programa DESPUÉS de responder al navegador (next/server `after`), para no frenar el pago;
 *  2) nunca lanza errores hacia la compra;
 *  3) queda registrado en la tabla correo_enviado (estado, proveedor, error).
 */

function programar(tarea: () => Promise<void>) {
  const segura = () => tarea().catch((e) => console.error("[correo] tarea fallida:", e instanceof Error ? e.message : e));
  try {
    after(segura);
  } catch {
    void segura(); // fuera de un contexto de petición (scripts)
  }
}

interface Envio {
  plantilla: NombrePlantilla;
  para: string;
  contenido: { asunto: string; html: string; texto: string };
  adjuntos?: Adjunto[];
  idUsuario?: number | null;
  idPedido?: number | null;
}

async function enviarYRegistrar(e: Envio): Promise<ResultadoEnvio> {
  const r = await enviarMensaje({ para: e.para, asunto: e.contenido.asunto, html: e.contenido.html, texto: e.contenido.texto, adjuntos: e.adjuntos });
  try {
    await db.correoEnviado.create({
      data: {
        idUsuario: e.idUsuario ?? null, idPedido: e.idPedido ?? null, destinatario: e.para.slice(0, 160), plantilla: e.plantilla,
        asunto: e.contenido.asunto.slice(0, 200), estado: r.estado, proveedor: r.proveedor, idExterno: r.idExterno ?? null, error: r.error ?? null,
      },
    });
  } catch (err) {
    console.error("[correo] no se pudo registrar el envío:", err instanceof Error ? err.message : err);
  }
  if (r.estado === "ERROR") console.error(`[correo] ${e.plantilla} → ${e.para}: ${r.error}`);
  return r;
}

/* ───────────── Carga de datos del pedido ───────────── */
async function cargarPedido(idPedido: number) {
  const p = await db.pedido.findUnique({ where: { idPedido }, include: { detallePedidos: { orderBy: { idDetalle: "asc" } }, pagos: true, factura: true } });
  if (!p) return null;
  const pago = p.pagos.filter((g) => g.estado === "APROBADO").at(0);
  const datos: DatosPedido = {
    numeroPedido: p.numeroPedido, nombre: p.nombreCompleto, email: p.emailContacto, estado: p.estado,
    subtotal: num(p.subtotal), descuento: num(p.descuento), iva: num(p.iva), total: num(p.total),
    fechaEstimadaEntrega: p.fechaEstimadaEntrega ? p.fechaEstimadaEntrega.toISOString().slice(0, 10) : null,
    direccion: p.direccionEnvio, ciudad: p.ciudad,
    items: p.detallePedidos.map((d) => ({ nombre: d.nombreItem, talla: d.talla, material: d.material, cantidad: d.cantidad, subtotal: num(d.subtotal) })),
    pago: pago ? { metodo: pago.metodo, detalle: pago.metodo === "TARJETA" ? `${pago.marcaTarjeta ?? "Tarjeta"} ····${pago.ultimos4?.trim() ?? ""}` : `PSE · ${pago.banco ?? ""}`, referencia: pago.referencia } : undefined,
    factura: p.factura ? { numeroFactura: p.factura.numeroFactura, ambiente: p.factura.ambiente } : undefined,
  };
  return { p, datos };
}

const adjuntoFactura = (f: { numeroFactura: string; xmlUbl: string }): Adjunto => ({ nombre: `${f.numeroFactura}.xml`, contenido: f.xmlUbl, tipo: "application/xml" });

/* ───────────── API pública (todas programan el envío y retornan de inmediato) ───────────── */
export function correoBienvenida(u: { idUsuario: number; nombre: string; email: string }) {
  programar(async () => {
    await enviarYRegistrar({ plantilla: "bienvenida", para: u.email, idUsuario: u.idUsuario, contenido: PLANTILLAS.bienvenida({ nombre: u.nombre }) });
  });
}

export function correoPagoAprobado(idPedido: number) {
  programar(async () => {
    const c = await cargarPedido(idPedido);
    if (!c) return;
    await enviarYRegistrar({
      plantilla: "pago_aprobado", para: c.datos.email, idUsuario: c.p.idCliente, idPedido, contenido: PLANTILLAS.pago_aprobado(c.datos),
      adjuntos: c.p.factura ? [adjuntoFactura(c.p.factura)] : undefined,
    });
    const admin = process.env.MAIL_ADMIN_TO?.trim();
    if (admin) await enviarYRegistrar({ plantilla: "admin_nuevo_pedido", para: admin, idPedido, contenido: PLANTILLAS.admin_nuevo_pedido(c.datos) });
  });
}

export function correoPagoRechazado(idPedido: number, motivo: string) {
  programar(async () => {
    const c = await cargarPedido(idPedido);
    if (!c) return;
    await enviarYRegistrar({ plantilla: "pago_rechazado", para: c.datos.email, idUsuario: c.p.idCliente, idPedido, contenido: PLANTILLAS.pago_rechazado(c.datos, { motivo }) });
  });
}

/** Cambio de estado hecho por el administrador (o cancelación del cliente). */
export function correoEstadoPedido(idPedido: number) {
  programar(async () => {
    const c = await cargarPedido(idPedido);
    if (!c) return;
    const esCancelado = c.p.estado === "CANCELADO";
    await enviarYRegistrar({
      plantilla: esCancelado ? "pedido_cancelado" : "estado_pedido", para: c.datos.email, idUsuario: c.p.idCliente, idPedido,
      contenido: esCancelado ? PLANTILLAS.pedido_cancelado(c.datos) : PLANTILLAS.estado_pedido(c.datos),
    });
  });
}

export function correoFacturaEmitida(idPedido: number) {
  programar(async () => {
    const c = await cargarPedido(idPedido);
    if (!c?.p.factura) return;
    await enviarYRegistrar({ plantilla: "factura_emitida", para: c.datos.email, idUsuario: c.p.idCliente, idPedido, contenido: PLANTILLAS.factura_emitida(c.datos), adjuntos: [adjuntoFactura(c.p.factura)] });
  });
}

/** Envío inmediato (el administrador espera el resultado) para verificar la configuración. */
export async function correoPrueba(para: string, idUsuario: number): Promise<ResultadoEnvio> {
  return enviarYRegistrar({ plantilla: "prueba", para, idUsuario, contenido: PLANTILLAS.prueba({ proveedor: nombreProveedor() }) });
}

export async function listarCorreos(limite = 100) {
  const rows = await db.correoEnviado.findMany({ orderBy: { idCorreo: "desc" }, take: limite });
  return rows.map((c) => ({
    idCorreo: c.idCorreo, destinatario: c.destinatario, plantilla: c.plantilla, asunto: c.asunto, estado: c.estado,
    proveedor: c.proveedor, error: c.error, idPedido: c.idPedido, createdAt: c.createdAt.toISOString(),
  }));
}

export function vistaPrevia(plantilla: string): string | null {
  const m = MUESTRA;
  switch (plantilla) {
    case "bienvenida": return PLANTILLAS.bienvenida({ nombre: m.nombre }).html;
    case "pago_aprobado": return PLANTILLAS.pago_aprobado(m).html;
    case "pago_rechazado": return PLANTILLAS.pago_rechazado(m, { motivo: "Fondos insuficientes." }).html;
    case "estado_pedido": return PLANTILLAS.estado_pedido(m).html;
    case "pedido_cancelado": return PLANTILLAS.pedido_cancelado({ ...m, estado: "CANCELADO" }).html;
    case "factura_emitida": return PLANTILLAS.factura_emitida(m).html;
    case "admin_nuevo_pedido": return PLANTILLAS.admin_nuevo_pedido(m).html;
    case "prueba": return PLANTILLAS.prueba({ proveedor: nombreProveedor() }).html;
    default: return null;
  }
}
export const PLANTILLAS_DISPONIBLES = ["bienvenida", "pago_aprobado", "pago_rechazado", "estado_pedido", "pedido_cancelado", "factura_emitida", "admin_nuevo_pedido", "prueba"] as const;
