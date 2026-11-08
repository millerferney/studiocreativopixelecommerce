"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { formatCOP } from "@/lib/money";
import { conAlfa } from "@/lib/tema";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/components/providers/AppProviders";
import type { PedidoDTO } from "@/server/dto";

export const COLOR_ESTADO: Record<string, string> = {
  PENDIENTE: "rgb(var(--c-purple))", PAGADO: "rgb(var(--c-cyan))", EN_DISENO: "rgb(var(--c-cyan))", EN_PRODUCCION: "rgb(var(--c-cyan))",
  ENVIADO: "rgb(var(--c-cyan))", RECIBIDO: "rgb(var(--c-mint))", CANCELADO: "rgb(var(--c-pink))",
};
export const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: "Pendiente", PAGADO: "Pagado", EN_DISENO: "En diseño", EN_PRODUCCION: "En producción",
  ENVIADO: "Enviado", RECIBIDO: "Recibido", CANCELADO: "Cancelado",
};

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** Calendario del mes de la fecha estimada de llegada (como el del prototipo, pero con datos reales). */
function Calendario({ fecha, color }: { fecha: string | null; color: string }) {
  const hoy = new Date();
  const ref = fecha ? new Date(fecha + "T12:00:00") : hoy;
  const y = ref.getFullYear(), m = ref.getMonth();
  const dias = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // semana inicia en lunes
  const esHoy = (d: number) => hoy.getFullYear() === y && hoy.getMonth() === m && hoy.getDate() === d;
  const esLlegada = (d: number) => !!fecha && ref.getDate() === d;
  return (
    <>
      <div style={{ fontFamily: "'Space Grotesk Variable',sans-serif", fontSize: 12, color: "rgb(var(--c-fg))", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
        <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}>{MESES[m]} {y}</span>
        {fecha && <span style={{ fontSize: 10, color: "rgb(var(--c-subtle))" }}>Entrega: <span style={{ color, fontWeight: "bold" }}>{ref.getDate()} {MESES[m].slice(0, 3)}</span></span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, textAlign: "center", fontSize: 11 }}>
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((h) => (
          <div key={h} style={{ color: "rgb(var(--c-dim1))", fontWeight: "bold", fontSize: 9, textTransform: "uppercase" }}>{h}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: dias }, (_, i) => i + 1).map((d) => (
          <div
            key={d}
            title={esLlegada(d) ? "Fecha de llegada estimada" : esHoy(d) ? "Hoy" : undefined}
            style={{
              padding: "4px 0", borderRadius: 6, position: "relative", cursor: "default",
              ...(esLlegada(d)
                ? { background: conAlfa(color, 0.13), color, fontWeight: "bold", border: `1px solid ${color}`, boxShadow: `0 0 10px ${conAlfa(color, 0.27)}` }
                : esHoy(d)
                  ? { background: "rgb(var(--c-fg) / calc(0.08 * var(--k)))", color: "rgb(var(--c-fg))", border: "1px dashed rgb(var(--c-fg) / calc(0.4 * var(--k)))" }
                  : { color: "rgb(var(--c-muted))" }),
            }}
          >
            {d}
            {esHoy(d) && <span style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, background: "rgb(var(--c-cyan))", borderRadius: "50%" }} />}
          </div>
        ))}
      </div>
    </>
  );
}

export function UserMenu({ onCerrar }: { onCerrar: () => void }) {
  const { user, esAdmin, cerrarSesion } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoDTO[] | null>(null);
  const [sel, setSel] = useState(0);
  const cliente = !!user?.roles.includes("CLIENTE");

  useEffect(() => {
    if (!cliente) return;
    api<PedidoDTO[]>("/api/pedidos").then(setPedidos).catch(() => setPedidos([]));
  }, [cliente]);

  const activo = pedidos?.[sel];
  const color = activo ? COLOR_ESTADO[activo.estado] : "rgb(var(--c-cyan))";
  const rol = esAdmin ? "Administrador" : "Cliente";

  return (
    <div className="user-dropdown" role="menu">
      <div style={{ padding: 16, borderBottom: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Space Grotesk Variable',sans-serif", fontSize: 14, fontWeight: "bold", color: "rgb(var(--c-fg))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.nombre} {user?.apellido ?? ""}
            </div>
            <div style={{ fontSize: 11, color: "rgb(var(--c-cyan))" }}>{rol}</div>
          </div>
          <button
            onClick={() => { onCerrar(); cerrarSesion(); }}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, color: "rgb(var(--c-pink))", display: "flex" }}
          >
            <Icon name="log-out" className="w-4 h-4" />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {esAdmin && (
            <Link href="/admin" onClick={onCerrar} className="btn-secondary" style={{ padding: "6px 10px", fontSize: 11 }}>Panel admin</Link>
          )}
          {cliente && (
            <>
              <Link href="/cuenta/pedidos" onClick={onCerrar} className="btn-secondary" style={{ padding: "6px 10px", fontSize: 11 }}>Mis pedidos</Link>
              <Link href="/cuenta/facturas" onClick={onCerrar} className="btn-secondary" style={{ padding: "6px 10px", fontSize: 11 }}>Mis facturas</Link>
            </>
          )}
        </div>
      </div>

      {cliente && (
        <>
          <div style={{ padding: "16px 16px 8px", maxHeight: 220, overflowY: "auto", borderBottom: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))" }}>
            <div style={{ fontFamily: "'Space Grotesk Variable',sans-serif", fontSize: 11, fontWeight: "bold", color: "rgb(var(--c-dim1))", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Historial de Compras
            </div>
            {pedidos === null && <p style={{ fontSize: 12, color: "rgb(var(--c-subtle))", margin: "0 0 8px" }}>Cargando…</p>}
            {pedidos?.length === 0 && <p style={{ fontSize: 12, color: "rgb(var(--c-subtle))", margin: "0 0 8px" }}>Aún no tienes pedidos.</p>}
            {pedidos?.slice(0, 20).map((o, idx) => {
              const c = COLOR_ESTADO[o.estado];
              return (
                <div
                  key={o.idPedido}
                  onClick={() => setSel(idx)}
                  className="order-card-hover"
                  style={{ padding: "10px 12px", border: "1px solid", borderRadius: 10, cursor: "pointer", marginBottom: 8, ...(idx === sel ? { borderColor: c, background: "rgb(var(--c-fg) / calc(0.04 * var(--k)))" } : { borderColor: "rgb(var(--c-fg) / calc(0.05 * var(--k)))", background: "transparent" }) }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono Variable',monospace", fontSize: 11, color: "rgb(var(--c-subtle))" }}>#{o.numeroPedido}</span>
                    <span style={{ fontFamily: "'Space Grotesk Variable',sans-serif", fontSize: 10, fontWeight: "bold", color: c, background: conAlfa(c, 0.08), padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {ETIQUETA_ESTADO[o.estado]}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgb(var(--c-fg))", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.items.map((i) => i.nombre).join(", ")}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontSize: 11, color: "rgb(var(--c-subtle))" }}>
                    <span>Total: <span style={{ fontFamily: "'JetBrains Mono Variable',monospace", color: "rgb(var(--c-fg))", fontWeight: "bold" }}>{formatCOP(o.total)}</span></span>
                    <span style={{ fontSize: 10, display: "inline-flex", alignItems: "center", gap: 2 }}><Icon name="calendar" className="w-[10px] h-[10px]" />{o.createdAt.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {activo && (
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: "'Space Grotesk Variable',sans-serif", fontSize: 11, fontWeight: "bold", color: "rgb(var(--c-dim1))", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Fecha de Llegada
              </div>
              <Calendario fecha={activo.estado === "CANCELADO" ? null : activo.fechaEstimadaEntrega} color={color} />
              <div style={{ marginTop: 12, fontSize: 10, color: "rgb(var(--c-subtle))", textAlign: "center", lineHeight: 1.4 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color, marginRight: 4 }} />
                Llegada estimada para el pedido #{activo.numeroPedido}: <br />
                <strong style={{ color: "rgb(var(--c-fg))" }}>{activo.fechaEstimadaEntrega ?? "—"}</strong>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
