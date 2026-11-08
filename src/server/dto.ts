import type { Prisma } from "@/generated/prisma/client";
import { num } from "@/lib/money";

// DTOs con la misma forma (camelCase) que devuelve pixel-api, para que el contrato REST se mantenga.

type ServicioConRel = Prisma.ServicioProductoGetPayload<{ include: { categoria: true; opcionProductos: true } }>;

export function servicioDTO(s: ServicioConRel) {
  const ops = [...s.opcionProductos].sort((a, b) => a.orden - b.orden);
  return {
    idServicio: s.idServicio,
    nombre: s.nombre,
    descripcion: s.descripcion,
    precio: num(s.precio),
    tiempoEntrega: s.tiempoEntrega,
    estado: s.estado,
    tipo: s.tipo,
    imagenUrl: s.imagenUrl,
    badge: s.badge,
    destacado: s.destacado,
    idCategoria: s.idCategoria,
    nombreCategoria: s.categoria.nombre,
    tallas: ops.filter((o) => o.tipo === "TALLA").map((o) => o.valor),
    materiales: ops.filter((o) => o.tipo === "MATERIAL").map((o) => o.valor),
  };
}
export type ServicioDTO = ReturnType<typeof servicioDTO>;

type UsuarioConRel = Prisma.UsuarioGetPayload<{ include: { usuarioRols: { include: { rol: true } }; cliente: true; administrador: true } }>;

export function usuarioDTO(u: UsuarioConRel) {
  return {
    idUsuario: u.idUsuario,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    telefono: u.telefono,
    estado: u.estado,
    roles: u.usuarioRols.map((r) => r.rol.nombre),
    direccion: u.cliente?.direccion ?? null,
    cargo: u.administrador?.cargo ?? null,
    ultimoLogin: u.ultimoLogin?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}
export type UsuarioDTO = ReturnType<typeof usuarioDTO>;

type PedidoFull = Prisma.PedidoGetPayload<{
  include: { detallePedidos: true; pagos: true; factura: true; ordenTrabajo: true; historialEstadoPedidos: true };
}>;

export function pedidoDTO(p: PedidoFull) {
  const pagos = [...p.pagos].sort((a, b) => b.idPago - a.idPago);
  return {
    idPedido: p.idPedido,
    numeroPedido: p.numeroPedido,
    estado: p.estado,
    subtotal: num(p.subtotal),
    descuento: num(p.descuento),
    iva: num(p.iva),
    total: num(p.total),
    fechaEstimadaEntrega: p.fechaEstimadaEntrega ? p.fechaEstimadaEntrega.toISOString().slice(0, 10) : null,
    createdAt: p.createdAt.toISOString(),
    envio: {
      nombreCompleto: p.nombreCompleto,
      tipoDocumento: p.tipoDocumento,
      numeroDocumento: p.numeroDocumento,
      email: p.emailContacto,
      telefono: p.telefono,
      direccion: p.direccionEnvio,
      ciudad: p.ciudad,
      departamento: p.departamento,
    },
    items: p.detallePedidos.map((d) => ({
      idDetalle: d.idDetalle,
      idServicio: d.idServicio,
      nombre: d.nombreItem,
      cantidad: d.cantidad,
      precioUnitario: num(d.precioUnitario),
      subtotal: num(d.subtotal),
      talla: d.talla,
      material: d.material,
      colorHex: d.colorHex?.trim() ?? null,
      estiloDiseno: d.estiloDiseno,
      archivoDiseno: d.archivoDiseno,
      notas: d.notas,
    })),
    pagos: pagos.map((g) => ({
      idPago: g.idPago,
      metodo: g.metodo,
      estado: g.estado,
      monto: num(g.monto),
      referencia: g.referencia,
      marcaTarjeta: g.marcaTarjeta,
      ultimos4: g.ultimos4?.trim() ?? null,
      banco: g.banco,
      mensaje: g.mensaje,
      fechaPago: g.fechaPago?.toISOString() ?? null,
    })),
    factura: p.factura
      ? { idFactura: p.factura.idFactura, numeroFactura: p.factura.numeroFactura, estado: p.factura.estado, fechaEmision: p.factura.fechaEmision.toISOString() }
      : null,
    ordenTrabajo: p.ordenTrabajo
      ? { numeroOrden: p.ordenTrabajo.numeroOrden, estado: p.ordenTrabajo.estado }
      : null,
    historial: [...p.historialEstadoPedidos]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((h) => ({ estadoAnterior: h.estadoAnterior, estadoNuevo: h.estadoNuevo, comentario: h.comentario, createdAt: h.createdAt.toISOString() })),
  };
}
export type PedidoDTO = ReturnType<typeof pedidoDTO>;

export const PEDIDO_INCLUDE = {
  detallePedidos: { orderBy: { idDetalle: "asc" } },
  pagos: true,
  factura: true,
  ordenTrabajo: true,
  historialEstadoPedidos: true,
} satisfies Prisma.PedidoInclude;
