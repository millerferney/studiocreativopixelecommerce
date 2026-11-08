import "server-only";
import { db } from "@/lib/db";
import { ApiError, conflict, notFound } from "@/lib/http";
import { num } from "@/lib/money";
import { obtenerProveedor } from "@/server/invoicing/provider";
import { notificar } from "./notificaciones";

/** Fecha y hora en Colombia (UTC-5, sin horario de verano) para el CUFE y el XML. */
export function fechaHoraColombia(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}:${p.second}-05:00` };
}

/**
 * Emite la factura electrónica de un pedido con pago APROBADO. Idempotente: si ya existe, la devuelve.
 * El consecutivo se toma con SELECT … FOR UPDATE sobre la resolución, dentro de la transacción.
 */
export async function emitirFactura(idPedido: number) {
  const existente = await db.factura.findUnique({ where: { idPedido } });
  if (existente) return existente;

  const pedido = await db.pedido.findUnique({ where: { idPedido }, include: { detallePedidos: { orderBy: { idDetalle: "asc" } }, pagos: true } });
  if (!pedido) throw notFound("Pedido no encontrado.");
  const pago = pedido.pagos.find((p) => p.estado === "APROBADO");
  if (!pago) throw conflict("El pedido no tiene un pago aprobado; no se puede facturar.");

  const empresa = await db.configuracionEmpresa.findUnique({ where: { id: 1 } });
  const res = await db.resolucionFacturacion.findFirst({ where: { activa: true }, orderBy: { idResolucion: "desc" } });
  if (!empresa || !res) throw new ApiError(500, "Falta configuracion_empresa o resolucion_facturacion (ejecuta db/02_seed.sql).");

  const proveedor = obtenerProveedor();
  const ahora = new Date();
  const { fecha, hora } = fechaHoraColombia(ahora);
  const ivaPct = num(empresa.ivaPorcentaje);
  const subtotal = num(pedido.subtotal);
  const descuento = num(pedido.descuento);
  const base = subtotal - descuento;
  const iva = num(pedido.iva);
  const total = num(pedido.total);

  return db.$transaction(async (tx) => {
    // Consecutivo atómico y sin saltos: bloquea la fila de la resolución (SELECT … FOR UPDATE, igual en PostgreSQL y MySQL)
    const filas = await tx.$queryRaw<{ actual: number | bigint }[]>`SELECT consecutivo_actual AS actual FROM resolucion_facturacion WHERE id_resolucion = ${res.idResolucion} FOR UPDATE`;
    if (filas.length === 0) throw new ApiError(500, "Resolución de facturación inexistente.");
    const n = Number(filas[0].actual) + 1;
    const hoy = new Date();
    if (n > res.hasta) throw new ApiError(500, "Rango de facturación agotado: solicita una nueva resolución a la DIAN.");
    if (hoy < res.fechaInicio || hoy > new Date(res.fechaFin.getTime() + 86_400_000)) throw new ApiError(500, "La resolución de facturación está vencida o aún no inicia.");
    await tx.resolucionFacturacion.update({ where: { idResolucion: res.idResolucion }, data: { consecutivoActual: n } });
    const numeroFactura = `${res.prefijo}${n}`;
    const items = pedido.detallePedidos.map((d) => ({
      descripcion: [d.nombreItem, d.talla, d.material].filter(Boolean).join(" · "),
      cantidad: d.cantidad,
      precioUnitario: num(d.precioUnitario),
      subtotal: num(d.subtotal),
    }));

    const r = await proveedor.emitir(
      {
        numeroFactura, fecha, hora, valorFactura: base, iva, total,
        nitEmisor: empresa.nit, numeroAdquirente: pedido.numeroDocumento,
        claveTecnica: res.claveTecnica, ambiente: res.ambiente as "1" | "2",
      },
      {
        numeroFactura, ambiente: res.ambiente as "1" | "2", fecha, hora,
        emisor: {
          razonSocial: empresa.razonSocial, nit: empresa.nit, dv: empresa.digitoVerificacion.trim(), direccion: empresa.direccion,
          ciudad: empresa.ciudad, codigoMunicipio: empresa.codigoMunicipio, departamento: empresa.departamento, email: empresa.email,
        },
        adquirente: {
          nombre: pedido.nombreCompleto, tipoDocumento: pedido.tipoDocumento, documento: pedido.numeroDocumento,
          email: pedido.emailContacto, direccion: pedido.direccionEnvio,
        },
        resolucion: {
          numero: res.numero, prefijo: res.prefijo, desde: res.desde, hasta: res.hasta,
          fechaInicio: res.fechaInicio.toISOString().slice(0, 10), fechaFin: res.fechaFin.toISOString().slice(0, 10),
        },
        items, subtotal, descuento, baseGravable: base, ivaPorcentaje: ivaPct, iva, total,
      },
    );

    const f = await tx.factura.create({
      data: {
        idPedido, idPago: pago.idPago, idResolucion: res.idResolucion, prefijo: res.prefijo, consecutivo: n, numeroFactura,
        cufe: r.cufe, estado: r.estado, ambiente: res.ambiente, proveedor: r.proveedor, fechaEmision: ahora,
        adquirenteNombre: pedido.nombreCompleto, adquirenteTipoDocumento: pedido.tipoDocumento, adquirenteDocumento: pedido.numeroDocumento,
        adquirenteEmail: pedido.emailContacto, adquirenteDireccion: pedido.direccionEnvio,
        subtotal, descuento, baseGravable: base, ivaPorcentaje: ivaPct, iva, total, xmlUbl: r.xml, qrData: r.qr,
        facturaItems: { create: items.map((it, i) => ({ linea: i + 1, descripcion: it.descripcion, cantidad: it.cantidad, precioUnitario: it.precioUnitario, subtotal: it.subtotal })) },
      },
    });
    await notificar(tx, pedido.idCliente, "FACTURA", "Factura electrónica emitida", `Se emitió la factura ${numeroFactura} de tu pedido ${pedido.numeroPedido}.`, idPedido);
    return f;
  });
}

const INC_FACTURA = { facturaItems: { orderBy: { linea: "asc" } }, pedido: true, resolucionFacturacion: true } as const;

export async function obtenerFacturaPorNumero(numero: string) {
  const f = await db.factura.findUnique({ where: { numeroFactura: numero }, include: INC_FACTURA });
  if (!f) throw notFound("Factura no encontrada.");
  return f;
}

export async function listarFacturas(idCliente?: number) {
  const rows = await db.factura.findMany({
    where: idCliente ? { pedido: { idCliente } } : {},
    orderBy: { idFactura: "desc" },
    include: { pedido: { select: { numeroPedido: true } } },
    take: 200,
  });
  return rows.map((f) => ({
    idFactura: f.idFactura, numeroFactura: f.numeroFactura, numeroPedido: f.pedido.numeroPedido, estado: f.estado,
    ambiente: f.ambiente, adquirente: f.adquirenteNombre, total: num(f.total), fechaEmision: f.fechaEmision.toISOString(),
  }));
}
