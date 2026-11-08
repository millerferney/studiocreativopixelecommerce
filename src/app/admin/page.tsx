import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Encabezado } from "@/components/admin/ui";
import { EstadoBadge } from "@/components/tienda/PedidoResumen";
import { formatCOP } from "@/lib/money";
import { resumenDashboard } from "@/server/services/dashboard";

export default async function Dashboard() {
  const d = await resumenDashboard();
  const tarjetas: { href: string; label: string; valor: string | number; icon: IconName; color: string }[] = [
    { href: "/admin/pagos", label: "Ventas aprobadas", valor: formatCOP(d.ventasTotal), icon: "wallet", color: "text-px-green" },
    { href: "/admin/pedidos", label: "Pagos aprobados", valor: d.pagosAprobados, icon: "circle-check", color: "text-px-green" },
    { href: "/admin/facturas", label: "Facturas emitidas", valor: d.facturas, icon: "receipt", color: "text-px-cyan" },
    { href: "/admin/servicios", label: "Productos disponibles", valor: `${d.disponibles}/${d.servicios}`, icon: "package", color: "text-px-cyan" },
    { href: "/admin/categorias", label: "Categorías", valor: d.categorias, icon: "tags", color: "text-px-cyan" },
    { href: "/admin/usuarios", label: "Usuarios", valor: d.usuarios, icon: "users", color: "text-px-green" },
  ];
  const estados = ["PENDIENTE", "PAGADO", "EN_DISENO", "EN_PRODUCCION", "ENVIADO", "RECIBIDO", "CANCELADO"];
  return (
    <section aria-labelledby="dash">
      <Encabezado titulo="Dashboard" sub="Resumen de la operación de Studio Creativo Pixel" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {tarjetas.map((t) => (
          <Link key={t.label} href={t.href} className="adm-card group flex items-center justify-between no-underline hover:border-px-cyan/40 transition-colors">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-px-faint m-0">{t.label}</p>
              <p className="font-display text-3xl font-bold text-fg m-0 mt-1">{t.valor}</p>
            </div>
            <Icon name={t.icon} className={`w-8 h-8 ${t.color} opacity-80`} />
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="adm-card">
          <h2 className="font-display text-lg font-bold mb-4">Pedidos por estado</h2>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {estados.map((e) => (
              <li key={e} className="flex items-center justify-between">
                <Link href={`/admin/pedidos?estado=${e}`} className="no-underline"><EstadoBadge estado={e} /></Link>
                <span className="font-mono text-sm">{d.pedidosPorEstado[e] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="adm-card">
          <h2 className="font-display text-lg font-bold mb-4">Últimos pedidos</h2>
          {d.ultimosPedidos.length === 0 && <p className="font-body text-sm text-px-faint m-0">Aún no hay pedidos.</p>}
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {d.ultimosPedidos.map((p) => (
              <li key={p.numeroPedido} className="flex items-center justify-between gap-3">
                <Link href={`/admin/pedidos/${p.numeroPedido}`} className="font-mono text-sm text-px-cyan hover:text-fg">{p.numeroPedido}</Link>
                <span className="font-body text-xs text-px-muted truncate flex-1">{p.cliente}</span>
                <EstadoBadge estado={p.estado} />
                <span className="font-mono text-xs">{formatCOP(p.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
