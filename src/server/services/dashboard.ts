import "server-only";
import { db } from "@/lib/db";
import { num } from "@/lib/money";

export async function resumenDashboard() {
  const [categorias, servicios, disponibles, usuarios, pedidosPorEstado, ventas, facturas, ultimos] = await Promise.all([
    db.categoria.count(),
    db.servicioProducto.count(),
    db.servicioProducto.count({ where: { estado: "DISPONIBLE" } }),
    db.usuario.count(),
    db.pedido.groupBy({ by: ["estado"], _count: { _all: true } }),
    db.pago.aggregate({ where: { estado: "APROBADO" }, _sum: { monto: true }, _count: { _all: true } }),
    db.factura.count(),
    db.pedido.findMany({ orderBy: { idPedido: "desc" }, take: 5, select: { numeroPedido: true, estado: true, total: true, nombreCompleto: true, createdAt: true } }),
  ]);
  return {
    categorias, servicios, disponibles, usuarios, facturas,
    ventasTotal: num(ventas._sum.monto), pagosAprobados: ventas._count._all,
    pedidosPorEstado: Object.fromEntries(pedidosPorEstado.map((p) => [p.estado, p._count._all])) as Record<string, number>,
    ultimosPedidos: ultimos.map((p) => ({ numeroPedido: p.numeroPedido, estado: p.estado, total: num(p.total), cliente: p.nombreCompleto, fecha: p.createdAt.toISOString() })),
  };
}
