import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, Vacio } from "@/components/admin/ui";
import { formatCOP } from "@/lib/money";
import { listarFacturas } from "@/server/services/facturacion";

export const metadata: Metadata = { title: "Facturas" };

export default async function Page() {
  const facturas = await listarFacturas();
  return (
    <section>
      <Encabezado titulo="Facturas electrónicas" sub="Emitidas automáticamente al aprobarse el pago" />
      <div className="adm-card p-0 overflow-x-auto">
        {facturas.length === 0 ? <Vacio texto="Aún no se han emitido facturas." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Listado de facturas</caption>
            <thead><tr><th scope="col">Factura</th><th scope="col">Pedido</th><th scope="col">Adquirente</th><th scope="col">Ambiente</th><th scope="col">Estado</th><th scope="col" className="text-right">Total</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.idFactura}>
                  <td className="font-mono">{f.numeroFactura}<div className="text-xs text-px-faint">{f.fechaEmision.slice(0, 10)}</div></td>
                  <td className="font-mono text-xs">{f.numeroPedido}</td>
                  <td>{f.adquirente}</td>
                  <td><span className={`adm-badge ${f.ambiente === "1" ? "adm-badge-green" : "adm-badge-purple"}`}>{f.ambiente === "1" ? "Producción" : "Pruebas"}</span></td>
                  <td><span className="adm-badge adm-badge-cyan">{f.estado}</span></td>
                  <td className="text-right font-mono">{formatCOP(f.total)}</td>
                  <td className="text-right whitespace-nowrap"><Link href={`/factura/${f.numeroFactura}`} className="text-px-cyan hover:text-fg mr-4">Ver</Link><a href={`/api/facturas/${f.numeroFactura}/xml`} className="text-px-muted hover:text-fg">XML</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
