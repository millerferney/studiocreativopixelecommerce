import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { formatCOP } from "@/lib/money";
import { conAlfa } from "@/lib/tema";
import type { PedidoDTO } from "@/server/dto";

export const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: "rgb(var(--c-purple))", PAGADO: "rgb(var(--c-cyan))", EN_DISENO: "rgb(var(--c-cyan))", EN_PRODUCCION: "rgb(var(--c-cyan))", ENVIADO: "rgb(var(--c-cyan))", RECIBIDO: "rgb(var(--c-mint))", CANCELADO: "rgb(var(--c-pink))",
};
export const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente de pago", PAGADO: "Pagado", EN_DISENO: "En diseño", EN_PRODUCCION: "En producción", ENVIADO: "Enviado", RECIBIDO: "Recibido", CANCELADO: "Cancelado",
};
const PASOS = ["PAGADO", "EN_DISENO", "EN_PRODUCCION", "ENVIADO", "RECIBIDO"];

export function EstadoBadge({ estado }: { estado: string }) {
  const c = COLOR_ESTADO[estado] ?? "rgb(var(--c-subtle))";
  return (
    <span className="font-display font-bold uppercase" style={{ fontSize: 11, color: c, background: conAlfa(c, 0.12), padding: "3px 10px", borderRadius: 6, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
      {ETIQUETA_ESTADO[estado] ?? estado}
    </span>
  );
}

const fecha = (iso: string) => new Date(iso).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" });

/** Detalle completo de un pedido (lo usan la confirmación, el historial del cliente y el panel admin). */
export function PedidoResumen({ p, admin = false }: { p: PedidoDTO; admin?: boolean }) {
  const idxPaso = PASOS.indexOf(p.estado);
  return (
    <div className="flex flex-col gap-8">
      <div className="card bg-px-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="font-mono text-[11px] text-px-faint uppercase tracking-widest m-0">Pedido</p>
            <h2 className="font-display font-bold text-2xl text-fg m-0">{p.numeroPedido}</h2>
          </div>
          <EstadoBadge estado={p.estado} />
        </div>

        {p.estado !== "CANCELADO" && p.estado !== "PENDIENTE" && (
          <ol className="flex items-center gap-2 mb-8 list-none p-0 overflow-x-auto" aria-label="Progreso del pedido">
            {PASOS.map((s, i) => {
              const hecho = i <= idxPaso;
              return (
                <li key={s} className="flex items-center gap-2 flex-1 min-w-[84px]">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: hecho ? "rgb(var(--c-green))" : "rgb(var(--c-elevated))", color: hecho ? "rgb(var(--c-on-accent))" : "rgb(var(--c-subtle))", border: hecho ? "none" : "1px solid rgb(var(--c-fg) / calc(0.1 * var(--k)))" }}>
                    {hecho ? <Icon name="check" className="w-3 h-3" /> : <span className="font-mono text-[10px]">{i + 1}</span>}
                  </span>
                  <span className={`font-mono text-[9px] uppercase tracking-wider ${hecho ? "text-fg" : "text-px-faint"}`}>{ETIQUETA_ESTADO[s]}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-body text-sm">
          <div>
            <p className="font-mono text-[10px] text-px-faint uppercase tracking-widest mb-1">Fecha del pedido</p>
            <p className="text-fg m-0">{fecha(p.createdAt)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-px-faint uppercase tracking-widest mb-1">Entrega estimada</p>
            <p className="text-fg m-0">{p.fechaEstimadaEntrega ?? "—"}</p>
          </div>
          {p.ordenTrabajo && (
            <div>
              <p className="font-mono text-[10px] text-px-faint uppercase tracking-widest mb-1">Orden de producción</p>
              <p className="text-fg m-0">{p.ordenTrabajo.numeroOrden} · {p.ordenTrabajo.estado.replace("_", " ")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-px-surface overflow-x-auto">
        <h3 className="font-display font-bold text-lg mb-4">Productos</h3>
        <table className="table-shell adm-table-lite w-full text-left" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="font-mono text-[10px] uppercase text-px-faint">
              <th className="py-2 pr-4">Producto</th><th className="py-2 pr-4">Personalización</th><th className="py-2 pr-4 text-right">Cant.</th><th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="font-body text-sm">
            {p.items.map((i) => (
              <tr key={i.idDetalle} className="border-t border-fg border-opacity-[0.05] align-top">
                <td className="py-3 pr-4 text-fg">{i.nombre}<br /><span className="font-mono text-[11px] text-px-faint">{formatCOP(i.precioUnitario)} c/u</span></td>
                <td className="py-3 pr-4 text-px-muted">
                  {[i.talla, i.material, i.estiloDiseno].filter(Boolean).join(" · ") || "—"}
                  {i.colorHex && <span className="inline-block w-3 h-3 rounded-full align-middle ml-2 border border-fg border-opacity-30" style={{ background: i.colorHex }} title={i.colorHex} />}
                  {i.notas && <><br /><span className="text-px-faint text-xs">“{i.notas}”</span></>}
                  {admin && i.archivoDiseno && <><br /><span className="text-px-cyan text-xs font-mono">Archivo: {i.archivoDiseno.split("/").pop()}</span></>}
                </td>
                <td className="py-3 pr-4 text-right font-mono">{i.cantidad}</td>
                <td className="py-3 text-right font-mono text-fg">{formatCOP(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 ml-auto max-w-[320px] flex flex-col gap-2 font-mono text-xs">
          <div className="flex justify-between text-px-muted"><span>Subtotal</span><span>{formatCOP(p.subtotal)}</span></div>
          <div className="flex justify-between text-px-green"><span>Descuento</span><span>-{formatCOP(p.descuento)}</span></div>
          <div className="flex justify-between text-px-muted"><span>IVA</span><span>{formatCOP(p.iva)}</span></div>
          <div className="flex justify-between text-fg text-base font-bold border-t border-fg border-opacity-10 pt-3"><span>TOTAL</span><span className="text-px-cyan">{formatCOP(p.total)}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card bg-px-surface">
          <h3 className="font-display font-bold text-lg mb-4">Envío y facturación</h3>
          <dl className="font-body text-sm text-px-muted grid gap-1 m-0">
            <dd className="text-fg m-0">{p.envio.nombreCompleto}</dd>
            <dd className="m-0">{p.envio.tipoDocumento} {p.envio.numeroDocumento}</dd>
            <dd className="m-0">{p.envio.direccion}, {p.envio.ciudad}, {p.envio.departamento}</dd>
            <dd className="m-0">{p.envio.email}{p.envio.telefono ? ` · ${p.envio.telefono}` : ""}</dd>
          </dl>
        </div>
        <div className="card bg-px-surface">
          <h3 className="font-display font-bold text-lg mb-4">Pagos</h3>
          {p.pagos.length === 0 && <p className="text-px-faint text-sm m-0">Sin intentos de pago.</p>}
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {p.pagos.map((g) => (
              <li key={g.idPago} className="font-body text-sm flex justify-between gap-4">
                <span className="text-px-muted">
                  {g.metodo === "TARJETA" ? `${g.marcaTarjeta ?? "Tarjeta"} ····${g.ultimos4 ?? ""}` : `PSE · ${g.banco ?? ""}`}
                  <br /><span className="font-mono text-[10px] text-px-faint">{g.referencia}</span>
                </span>
                <span className="text-right">
                  <span className="font-mono text-xs" style={{ color: g.estado === "APROBADO" ? "rgb(var(--c-mint))" : g.estado === "RECHAZADO" ? "rgb(var(--c-danger))" : "rgb(var(--c-muted))" }}>{g.estado}</span>
                  <br /><span className="font-mono text-xs text-fg">{formatCOP(g.monto)}</span>
                </span>
              </li>
            ))}
          </ul>
          {p.factura && (
            <div className="mt-6 pt-4 border-t border-fg border-opacity-[0.06] flex flex-wrap gap-3 items-center justify-between">
              <span className="font-mono text-xs text-px-faint">Factura <span className="text-fg">{p.factura.numeroFactura}</span></span>
              <span className="flex gap-2">
                <Link href={`/factura/${p.factura.numeroFactura}`} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}><Icon name="receipt" className="w-3 h-3 inline mr-1" />Ver factura</Link>
                <a href={`/api/facturas/${p.factura.numeroFactura}/xml`} className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}><Icon name="file-code" className="w-3 h-3 inline mr-1" />XML</a>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-px-surface">
        <h3 className="font-display font-bold text-lg mb-4">Historial de estados</h3>
        <ul className="list-none p-0 m-0 flex flex-col gap-3">
          {p.historial.map((h, i) => (
            <li key={i} className="flex gap-3 font-body text-sm">
              <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: COLOR_ESTADO[h.estadoNuevo] }} />
              <span className="text-px-muted"><span className="text-fg">{ETIQUETA_ESTADO[h.estadoNuevo]}</span> · {fecha(h.createdAt)}{h.comentario && <span className="text-px-faint"> — {h.comentario}</span>}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
