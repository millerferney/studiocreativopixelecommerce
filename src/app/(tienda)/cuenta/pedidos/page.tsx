import type { Metadata } from "next";
import Link from "next/link";
import { EstadoBadge } from "@/components/tienda/PedidoResumen";
import { requerirUsuario } from "@/lib/auth";
import { formatCOP } from "@/lib/money";
import { listarPedidosCliente } from "@/server/services/pedidos";

export const metadata: Metadata = { title: "Mis pedidos" };
export const dynamic = "force-dynamic";

export default async function MisPedidos() {
  const u = await requerirUsuario("CLIENTE");
  const pedidos = await listarPedidosCliente(u.idUsuario);
  if (pedidos.length === 0)
    return (
      <div className="card bg-px-surface text-center p-10">
        <p className="font-display font-bold text-lg mb-2">Aún no tienes pedidos</p>
        <p className="font-body text-sm text-px-muted mb-5">Cuando compres, aquí verás el estado, los pagos y las facturas.</p>
        <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
      </div>
    );
  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-4">
      {pedidos.map((p) => (
        <li key={p.idPedido}>
          <Link href={`/cuenta/pedidos/${p.numeroPedido}`} className="card bg-px-surface block hover:border-px-cyan hover:border-opacity-40 transition" style={{ textDecoration: "none" }}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
              <span className="font-mono text-sm text-fg">{p.numeroPedido}</span>
              <EstadoBadge estado={p.estado} />
            </div>
            <p className="font-body text-sm text-px-muted m-0 truncate">{p.items.map((i) => `${i.nombre} ×${i.cantidad}`).join(", ")}</p>
            <div className="flex justify-between mt-3 font-mono text-xs text-px-faint">
              <span>{p.createdAt.slice(0, 10)}{p.factura ? ` · Factura ${p.factura.numeroFactura}` : ""}</span>
              <span className="text-px-cyan font-bold">{formatCOP(p.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
