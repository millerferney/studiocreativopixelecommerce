import type { Metadata } from "next";
import { Encabezado, Vacio } from "@/components/admin/ui";
import { formatCOP } from "@/lib/money";
import { listarPagos } from "@/server/services/pedidos";

export const metadata: Metadata = { title: "Pagos" };
const COLOR: Record<string, string> = { APROBADO: "adm-badge-green", RECHAZADO: "adm-badge-danger", PENDIENTE: "adm-badge-purple", REEMBOLSADO: "adm-badge-cyan" };

export default async function Page() {
  const pagos = await listarPagos();
  return (
    <section>
      <Encabezado titulo="Pagos" sub="Transacciones registradas (pasarela simulada)" />
      <div className="adm-card p-0 overflow-x-auto">
        {pagos.length === 0 ? <Vacio texto="Aún no hay pagos." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Listado de pagos</caption>
            <thead><tr><th scope="col">Referencia</th><th scope="col">Pedido</th><th scope="col">Cliente</th><th scope="col">Medio</th><th scope="col">Estado</th><th scope="col">Factura</th><th scope="col" className="text-right">Monto</th></tr></thead>
            <tbody>
              {pagos.map((g) => (
                <tr key={g.idPago}>
                  <td className="font-mono text-xs">{g.referencia}<div className="text-px-faint">{g.fecha.slice(0, 16).replace("T", " ")}</div></td>
                  <td className="font-mono text-xs">{g.numeroPedido}</td>
                  <td>{g.cliente}</td>
                  <td className="text-px-muted text-xs">{g.metodo === "TARJETA" ? `${g.marcaTarjeta} ····${g.ultimos4}` : `PSE · ${g.banco}`}</td>
                  <td><span className={`adm-badge ${COLOR[g.estado]}`} title={g.mensaje ?? undefined}>{g.estado}</span></td>
                  <td className="font-mono text-xs text-px-muted">{g.numeroFactura ?? "—"}</td>
                  <td className="text-right font-mono">{formatCOP(g.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
