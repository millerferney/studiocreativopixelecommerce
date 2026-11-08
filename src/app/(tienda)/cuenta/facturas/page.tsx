import type { Metadata } from "next";
import Link from "next/link";
import { requerirUsuario } from "@/lib/auth";
import { formatCOP } from "@/lib/money";
import { listarFacturas } from "@/server/services/facturacion";

export const metadata: Metadata = { title: "Mis facturas" };
export const dynamic = "force-dynamic";

export default async function MisFacturas() {
  const u = await requerirUsuario("CLIENTE");
  const facturas = await listarFacturas(u.idUsuario);
  if (facturas.length === 0) return <div className="card bg-px-surface text-center p-10 font-body text-sm text-px-muted">Tus facturas electrónicas aparecerán aquí cuando completes una compra.</div>;
  return (
    <div className="card bg-px-surface overflow-x-auto">
      <table className="w-full text-left font-body text-sm" style={{ borderCollapse: "collapse" }}>
        <thead><tr className="font-mono text-[10px] uppercase text-px-faint"><th className="py-2 pr-4">Factura</th><th className="py-2 pr-4">Pedido</th><th className="py-2 pr-4">Fecha</th><th className="py-2 pr-4 text-right">Total</th><th className="py-2" /></tr></thead>
        <tbody>
          {facturas.map((f) => (
            <tr key={f.idFactura} className="border-t border-fg border-opacity-[0.05]">
              <td className="py-3 pr-4 font-mono text-fg">{f.numeroFactura}</td>
              <td className="py-3 pr-4 text-px-muted">{f.numeroPedido}</td>
              <td className="py-3 pr-4 text-px-muted">{f.fechaEmision.slice(0, 10)}</td>
              <td className="py-3 pr-4 text-right font-mono text-px-cyan">{formatCOP(f.total)}</td>
              <td className="py-3 text-right whitespace-nowrap">
                <Link href={`/factura/${f.numeroFactura}`} className="text-px-cyan hover:text-fg mr-4">Ver</Link>
                <a href={`/api/facturas/${f.numeroFactura}/xml`} className="text-px-muted hover:text-fg">XML</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
