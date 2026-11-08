import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, Vacio } from "@/components/admin/ui";
import { EstadoBadge, ETIQUETA_ESTADO } from "@/components/tienda/PedidoResumen";
import { formatCOP } from "@/lib/money";
import { listarPedidosAdmin } from "@/server/services/pedidos";

export const metadata: Metadata = { title: "Pedidos" };
const ESTADOS = Object.keys(ETIQUETA_ESTADO);

export default async function Page({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const filtro = estado && ESTADOS.includes(estado) ? estado : undefined;
  const pedidos = await listarPedidosAdmin(filtro);
  return (
    <section>
      <Encabezado titulo="Pedidos" sub="Gestiona el avance de producción y entrega" />
      <div className="flex flex-wrap gap-2 mb-5">
        <Link href="/admin/pedidos" className={`adm-badge ${!filtro ? "adm-badge-cyan" : ""} no-underline`}>Todos</Link>
        {ESTADOS.map((e) => <Link key={e} href={`/admin/pedidos?estado=${e}`} className={`adm-badge ${filtro === e ? "adm-badge-cyan" : ""} no-underline`}>{ETIQUETA_ESTADO[e]}</Link>)}
      </div>
      <div className="adm-card p-0 overflow-x-auto">
        {pedidos.length === 0 ? <Vacio texto="No hay pedidos con este filtro." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Listado de pedidos</caption>
            <thead><tr><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Estado</th><th scope="col">Factura</th><th scope="col">Fecha</th><th scope="col" className="text-right">Total</th></tr></thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.idPedido}>
                  <td><Link href={`/admin/pedidos/${p.numeroPedido}`} className="font-mono text-px-cyan hover:text-fg">{p.numeroPedido}</Link></td>
                  <td>{p.envio.nombreCompleto}<div className="text-xs text-px-faint">{p.items.length} ítem(s)</div></td>
                  <td><EstadoBadge estado={p.estado} /></td>
                  <td className="font-mono text-xs text-px-muted">{p.factura?.numeroFactura ?? "—"}</td>
                  <td className="text-px-muted text-xs font-mono">{p.createdAt.slice(0, 10)}</td>
                  <td className="text-right font-mono">{formatCOP(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
