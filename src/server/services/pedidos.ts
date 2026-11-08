import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import type { UsuarioSesion } from "@/lib/auth";
import { badRequest, conflict, forbidden, notFound } from "@/lib/http";
import { calcularTotales, num, sumarDiasHabiles } from "@/lib/money";
import { pasarela } from "@/server/payments/pasarela";
import { cambiarEstadoPedidoSchema, checkoutSchema, pagoSchema } from "@/server/schemas";
import { PEDIDO_INCLUDE, pedidoDTO } from "@/server/dto";
import { resolverItems } from "./carrito";
import { emitirFactura } from "./facturacion";
import { notificar, notificarAdministradores } from "./notificaciones";
import { correoEstadoPedido, correoPagoAprobado, correoPagoRechazado } from "@/server/mail/correos";

type DatosPago = z.output<typeof pagoSchema>;

async function parametros() {
  const e = await db.configuracionEmpresa.findUnique({ where: { id: 1 } });
  return { ivaPct: num(e?.ivaPorcentaje ?? 19), descPct: num(e?.descuentoPorcentaje ?? 5) };
}

/** Transiciones de estado permitidas para el administrador. */
const TRANSICIONES: Record<string, string[]> = {
  PENDIENTE: ["CANCELADO"],
  PAGADO: ["EN_DISENO", "EN_PRODUCCION"],
  EN_DISENO: ["EN_PRODUCCION"],
  EN_PRODUCCION: ["ENVIADO"],
  ENVIADO: ["RECIBIDO"],
};
const ESTADO_OT: Record<string, string> = { EN_DISENO: "EN_DISENO", EN_PRODUCCION: "EN_PRODUCCION", ENVIADO: "TERMINADA", RECIBIDO: "TERMINADA" };
export const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente de pago", PAGADO: "Pagado", EN_DISENO: "En diseño", EN_PRODUCCION: "En producción",
  ENVIADO: "Enviado", RECIBIDO: "Recibido", CANCELADO: "Cancelado",
};

/**
 * CHECKOUT (CU-03 + CU-04): crea el pedido con precios del servidor y cobra en la pasarela.
 * El pedido queda PENDIENTE aunque el pago falle, para poder reintentar (flujo alternativo CU-04).
 */
export async function realizarCheckout(usuario: UsuarioSesion, data: unknown) {
  if (!usuario.roles.includes("CLIENTE")) throw forbidden("Solo las cuentas de cliente pueden comprar.");
  const d = checkoutSchema.parse(data);
  const { ivaPct, descPct } = await parametros();

  const idPedido = await db.$transaction(async (tx) => {
    const lineas = await resolverItems(d.items, tx);
    const subtotal = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
    const t = calcularTotales(subtotal, ivaPct, descPct);
    const entrega = sumarDiasHabiles(new Date(), Math.max(...lineas.map((l) => l.tiempoEntrega)) + 2); // +2 días de envío

    const p = await tx.pedido.create({
      data: {
        idCliente: usuario.idUsuario, estado: "PENDIENTE",
        subtotal: t.subtotal, descuento: t.descuento, iva: t.iva, total: t.total,
        nombreCompleto: d.envio.nombreCompleto, tipoDocumento: d.envio.tipoDocumento, numeroDocumento: d.envio.numeroDocumento,
        emailContacto: d.envio.email, telefono: d.envio.telefono, direccionEnvio: d.envio.direccion,
        ciudad: d.envio.ciudad, departamento: d.envio.departamento, fechaEstimadaEntrega: entrega,
        detallePedidos: {
          create: lineas.map((l) => ({
            idServicio: l.idServicio, nombreItem: l.nombre, cantidad: l.cantidad, precioUnitario: l.precio, subtotal: l.precio * l.cantidad,
            talla: l.talla, material: l.material, colorHex: l.colorHex, estiloDiseno: l.estiloEtiqueta, archivoDiseno: l.archivoDiseno, notas: l.notas,
          })),
        },
        historialEstadoPedidos: { create: { estadoNuevo: "PENDIENTE", idUsuario: usuario.idUsuario, comentario: "Pedido creado" } },
      },
    });
    // Guarda los datos de facturación/envío en el perfil para prellenar la próxima compra
    await tx.cliente.upsert({
      where: { idUsuario: usuario.idUsuario },
      create: { idUsuario: usuario.idUsuario, tipoDocumento: d.envio.tipoDocumento, numeroDocumento: d.envio.numeroDocumento, direccion: d.envio.direccion, ciudad: d.envio.ciudad, departamento: d.envio.departamento },
      update: { tipoDocumento: d.envio.tipoDocumento, numeroDocumento: d.envio.numeroDocumento, direccion: d.envio.direccion, ciudad: d.envio.ciudad, departamento: d.envio.departamento },
    });
    // El carrito abierto queda CONVERTIDO (se crea uno nuevo la próxima vez)
    await tx.carrito.updateMany({ where: { idCliente: usuario.idUsuario, estado: "ABIERTO" }, data: { estado: "CONVERTIDO" } });
    await notificar(tx, usuario.idUsuario, "PEDIDO", "Pedido recibido", `Recibimos tu pedido ${p.numeroPedido}. Falta confirmar el pago.`, p.idPedido);
    return p.idPedido;
  });

  const pago = await procesarPago(idPedido, usuario, d.pago);
  const pedido = await obtenerPedido(idPedido, usuario);
  return { pedido, pago };
}

/** Cobra un pedido PENDIENTE (también sirve para reintentar tras un rechazo). */
export async function procesarPago(idPedido: number, usuario: UsuarioSesion, datos: DatosPago) {
  const pedido = await db.pedido.findUnique({ where: { idPedido } });
  if (!pedido) throw notFound("Pedido no encontrado.");
  if (pedido.idCliente !== usuario.idUsuario) throw forbidden();
  if (pedido.estado !== "PENDIENTE") throw conflict(`El pedido ${pedido.numeroPedido} ya no está pendiente de pago.`);

  const referencia = `PAY-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const monto = num(pedido.total);
  const r = await pasarela.cobrar({
    metodo: datos.metodo, monto, referencia,
    tarjeta: datos.metodo === "TARJETA" ? { numero: datos.numero, expiracion: datos.expiracion, cvv: datos.cvv } : undefined,
    pse: datos.metodo === "PSE" ? { banco: datos.banco, tipoPersona: datos.tipoPersona } : undefined,
  });

  const pagoRow = await db.$transaction(async (tx) => {
    const pg = await tx.pago.create({
      data: {
        idPedido, metodo: datos.metodo, estado: r.aprobado ? "APROBADO" : "RECHAZADO", monto, referencia,
        referenciaPasarela: r.referenciaPasarela, marcaTarjeta: r.marcaTarjeta, ultimos4: r.ultimos4, banco: r.banco,
        codigoRespuesta: r.codigo, mensaje: r.mensaje, fechaPago: r.aprobado ? new Date() : null,
      },
    });
    if (r.aprobado) {
      await tx.pedido.update({ where: { idPedido }, data: { estado: "PAGADO" } });
      await tx.historialEstadoPedido.create({ data: { idPedido, estadoAnterior: "PENDIENTE", estadoNuevo: "PAGADO", idUsuario: usuario.idUsuario, comentario: `Pago aprobado (${datos.metodo})` } });
      await tx.ordenTrabajo.create({ data: { idPedido } }); // CU-05: orden de trabajo automática
      await notificar(tx, pedido.idCliente, "PAGO", "Pago aprobado", `Tu pago de ${monto.toLocaleString("es-CO")} COP para ${pedido.numeroPedido} fue aprobado.`, idPedido);
      await notificarAdministradores(tx, "PEDIDO", "Nuevo pedido pagado", `${pedido.numeroPedido} de ${pedido.nombreCompleto} listo para producción.`, idPedido);
    } else {
      await notificar(tx, pedido.idCliente, "PAGO", "Pago rechazado", `${r.mensaje} Puedes reintentar el pago de ${pedido.numeroPedido}.`, idPedido);
    }
    return pg;
  });

  // La factura va en una transacción aparte: si falla, el pago ya aprobado NO se revierte
  // y el administrador puede reintentar la emisión desde el panel.
  let facturaError: string | null = null;
  if (r.aprobado) {
    try {
      await emitirFactura(idPedido);
    } catch (e) {
      facturaError = e instanceof Error ? e.message : "Error desconocido";
      console.error("[factura] no se pudo emitir para el pedido", idPedido, facturaError);
    }
  }
  // Correo al cliente (con la factura XML adjunta si ya se emitió); se envía después de responder
  if (r.aprobado) correoPagoAprobado(idPedido);
  else correoPagoRechazado(idPedido, r.mensaje);
  return { idPago: pagoRow.idPago, aprobado: r.aprobado, estado: pagoRow.estado, mensaje: r.mensaje, codigo: r.codigo, referencia, facturaPendiente: r.aprobado && !!facturaError };
}

export async function obtenerPedido(idPedido: number, usuario: UsuarioSesion) {
  const p = await db.pedido.findUnique({ where: { idPedido }, include: PEDIDO_INCLUDE });
  if (!p) throw notFound("Pedido no encontrado.");
  if (p.idCliente !== usuario.idUsuario && !usuario.roles.includes("ADMINISTRADOR")) throw forbidden();
  return pedidoDTO(p);
}

export async function obtenerPedidoPorNumero(numero: string, usuario: UsuarioSesion) {
  const p = await db.pedido.findUnique({ where: { numeroPedido: numero }, include: PEDIDO_INCLUDE });
  if (!p) throw notFound("Pedido no encontrado.");
  if (p.idCliente !== usuario.idUsuario && !usuario.roles.includes("ADMINISTRADOR")) throw forbidden();
  return pedidoDTO(p);
}

export async function listarPedidosCliente(idCliente: number) {
  const rows = await db.pedido.findMany({ where: { idCliente }, include: PEDIDO_INCLUDE, orderBy: { idPedido: "desc" }, take: 100 });
  return rows.map(pedidoDTO);
}

export async function listarPedidosAdmin(estado?: string) {
  const rows = await db.pedido.findMany({
    where: estado ? { estado } : {}, include: PEDIDO_INCLUDE, orderBy: { idPedido: "desc" }, take: 300,
  });
  return rows.map(pedidoDTO);
}

/** El cliente puede cancelar solo mientras el pedido siga pendiente de pago. */
export async function cancelarPedidoCliente(idPedido: number, usuario: UsuarioSesion) {
  const p = await db.pedido.findUnique({ where: { idPedido } });
  if (!p) throw notFound("Pedido no encontrado.");
  if (p.idCliente !== usuario.idUsuario) throw forbidden();
  if (p.estado !== "PENDIENTE") throw conflict("Solo se pueden cancelar pedidos pendientes de pago.");
  await db.$transaction(async (tx) => {
    await tx.pedido.update({ where: { idPedido }, data: { estado: "CANCELADO" } });
    await tx.historialEstadoPedido.create({ data: { idPedido, estadoAnterior: "PENDIENTE", estadoNuevo: "CANCELADO", idUsuario: usuario.idUsuario, comentario: "Cancelado por el cliente" } });
  });
  correoEstadoPedido(idPedido);
  return obtenerPedido(idPedido, usuario);
}

export async function cambiarEstadoPedido(idPedido: number, data: unknown, admin: UsuarioSesion) {
  const d = cambiarEstadoPedidoSchema.parse(data);
  const p = await db.pedido.findUnique({ where: { idPedido } });
  if (!p) throw notFound("Pedido no encontrado.");
  const permitidos = TRANSICIONES[p.estado] ?? [];
  if (!permitidos.includes(d.estado))
    throw badRequest(`No se puede pasar de "${ETIQUETA_ESTADO[p.estado]}" a "${ETIQUETA_ESTADO[d.estado]}".` + (permitidos.length ? ` Permitido: ${permitidos.map((x) => ETIQUETA_ESTADO[x]).join(", ")}.` : " El pedido está en un estado final."));
  await db.$transaction(async (tx) => {
    await tx.pedido.update({ where: { idPedido }, data: { estado: d.estado } });
    await tx.historialEstadoPedido.create({ data: { idPedido, estadoAnterior: p.estado, estadoNuevo: d.estado, idUsuario: admin.idUsuario, comentario: d.comentario } });
    if (ESTADO_OT[d.estado]) await tx.ordenTrabajo.updateMany({ where: { idPedido }, data: { estado: ESTADO_OT[d.estado] } });
    await notificar(tx, p.idCliente, d.estado === "ENVIADO" || d.estado === "RECIBIDO" ? "PEDIDO" : "PRODUCCION", `Pedido ${ETIQUETA_ESTADO[d.estado].toLowerCase()}`, `Tu pedido ${p.numeroPedido} ahora está: ${ETIQUETA_ESTADO[d.estado]}.`, idPedido);
  });
  correoEstadoPedido(idPedido);
  return obtenerPedido(idPedido, admin);
}

export async function listarPagos() {
  const rows = await db.pago.findMany({ orderBy: { idPago: "desc" }, take: 300, include: { pedido: { select: { numeroPedido: true, nombreCompleto: true } }, factura: { select: { numeroFactura: true } } } });
  return rows.map((g) => ({
    idPago: g.idPago, numeroPedido: g.pedido.numeroPedido, cliente: g.pedido.nombreCompleto, metodo: g.metodo, estado: g.estado,
    monto: num(g.monto), referencia: g.referencia, marcaTarjeta: g.marcaTarjeta, ultimos4: g.ultimos4?.trim() ?? null, banco: g.banco,
    mensaje: g.mensaje, fecha: (g.fechaPago ?? g.createdAt).toISOString(), numeroFactura: g.factura?.numeroFactura ?? null,
  }));
}
