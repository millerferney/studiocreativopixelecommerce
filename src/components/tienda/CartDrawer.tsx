"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { claveItem, useAuth, useCart } from "@/components/providers/AppProviders";
import { formatCOP } from "@/lib/money";

export function CartDrawer() {
  const { items, abierto, cerrar, cambiarCantidad, quitar, totales, cantidadTotal, ivaPct } = useCart();
  const { user, abrirAuth } = useAuth();

  useEffect(() => {
    if (!abierto) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [abierto, cerrar]);

  return (
    <>
      <div id="cart-overlay" className={abierto ? "is-open" : ""} onClick={cerrar} />
      <div id="cart-drawer" className={abierto ? "is-open" : ""} role="dialog" aria-label="Carrito de compras" aria-hidden={!abierto}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottom: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))", flexShrink: 0 }}>
          <div>
            <h2 className="font-display text-xl font-bold m-0"><span style={{ color: "rgb(var(--c-mint))" }}>Tu</span> Carrito.</h2>
            <p className="font-body text-[13px] m-0 mt-1" style={{ color: "rgb(var(--c-muted))" }}>
              {cantidadTotal} ítem{cantidadTotal !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={cerrar}
            aria-label="Cerrar carrito"
            className="hover:text-fg"
            style={{ width: 36, height: 36, borderRadius: 8, background: "rgb(var(--c-fg) / calc(0.08 * var(--k)))", border: "1px solid rgb(var(--c-fg) / calc(0.1 * var(--k)))", color: "rgb(var(--c-muted))", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="x" style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {items.map((it) => {
            const k = claveItem(it);
            return (
              <div key={k} style={{ display: "flex", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))", alignItems: "flex-start" }}>
                <div style={{ width: 72, height: 72, borderRadius: 10, background: "linear-gradient(135deg,rgb(var(--c-elevated)),rgb(var(--c-overlay)))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {it.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imagenUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Icon name="package" style={{ width: 24, height: 24, color: "rgb(var(--c-cyan) / 0.3)" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 title={it.nombre} style={{ fontFamily: "'Space Grotesk Variable',sans-serif", fontSize: 14, color: "rgb(var(--c-fg))", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.nombre}</h4>
                    <button onClick={() => quitar(k)} aria-label={`Quitar ${it.nombre}`} className="hover:text-px-danger" style={{ background: "none", border: "none", color: "rgb(var(--c-subtle))", cursor: "pointer", padding: 2, marginLeft: 8, flexShrink: 0 }}>
                      <Icon name="trash-2" style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                  {(it.talla || it.material || it.colorHex) && (
                    <p className="font-mono" style={{ fontSize: 10, color: "rgb(var(--c-subtle))", margin: "0 0 2px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {[it.talla, it.material].filter(Boolean).join(" · ")}
                      {it.colorHex && <span title={it.colorHex} style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: it.colorHex, border: "1px solid rgb(var(--c-fg) / calc(0.3 * var(--k)))" }} />}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", background: "rgb(var(--c-elevated))", border: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))", borderRadius: 6, overflow: "hidden" }}>
                      <button onClick={() => cambiarCantidad(k, -1)} aria-label="Disminuir cantidad" className="hover:text-fg" style={{ width: 28, height: 28, background: "none", border: "none", color: "rgb(var(--c-muted))", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="minus" style={{ width: 12, height: 12 }} />
                      </button>
                      <span style={{ fontFamily: "'JetBrains Mono Variable',monospace", fontSize: 12, width: 20, textAlign: "center", color: "rgb(var(--c-fg))" }}>{it.cantidad}</span>
                      <button onClick={() => cambiarCantidad(k, 1)} aria-label="Aumentar cantidad" className="hover:text-fg" style={{ width: 28, height: 28, background: "none", border: "none", color: "rgb(var(--c-muted))", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="plus" style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono Variable',monospace", color: "rgb(var(--c-cyan))", fontSize: 13, fontWeight: "bold" }}>{formatCOP(it.precio * it.cantidad)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "56px 24px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgb(var(--c-elevated))", border: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "rgb(var(--c-dim2))" }}>
                <Icon name="shopping-cart" style={{ width: 28, height: 28 }} />
              </div>
              <p className="font-display font-bold m-0 mb-1" style={{ color: "rgb(var(--c-muted))" }}>Tu carrito está vacío</p>
              <p className="font-body text-[13px] m-0 mb-5" style={{ color: "rgb(var(--c-subtle))" }}>Agrega productos desde el catálogo</p>
              <Link href="/catalogo" onClick={cerrar} className="btn-primary">Ver Catálogo</Link>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))", padding: 20, flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <Fila k="Subtotal" v={formatCOP(totales.subtotal)} />
              <Fila k="Descuento" v={`-${formatCOP(totales.descuento)}`} verde />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgb(var(--c-slate))", borderBottom: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))", paddingBottom: 12 }}>
                <span>IVA {ivaPct}%</span><span style={{ fontFamily: "'JetBrains Mono Variable',monospace", color: "rgb(var(--c-ink2))" }}>{formatCOP(totales.iva)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Space Grotesk Variable',sans-serif", fontWeight: 700, fontSize: 16, paddingTop: 4 }}>
                <span style={{ color: "rgb(var(--c-fg))", textTransform: "uppercase" }}>Total</span>
                <span style={{ fontFamily: "'JetBrains Mono Variable',monospace", color: "rgb(var(--c-cyan))" }}>{formatCOP(totales.total)}</span>
              </div>
            </div>
            {user ? (
              <Link href="/checkout" onClick={cerrar} className="btn-success w-full flex items-center justify-center gap-2 py-3 text-sm font-bold mb-2">
                Confirmar Pedido <Icon name="arrow-right" style={{ width: 16, height: 16 }} />
              </Link>
            ) : (
              <button onClick={() => { cerrar(); abrirAuth("login"); }} className="btn-success w-full flex items-center justify-center gap-2 py-3 text-sm font-bold mb-2">
                Inicia sesión para pagar <Icon name="arrow-right" style={{ width: 16, height: 16 }} />
              </button>
            )}
            <button onClick={cerrar} className="hover:text-fg" style={{ width: "100%", background: "none", border: "none", fontFamily: "'Outfit Variable',sans-serif", fontSize: 13, color: "rgb(var(--c-subtle))", cursor: "pointer", padding: 8 }}>
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Fila({ k, v, verde }: { k: string; v: string; verde?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgb(var(--c-slate))" }}>
      <span>{k}</span><span style={{ fontFamily: "'JetBrains Mono Variable',monospace", color: verde ? "rgb(var(--c-mint))" : "rgb(var(--c-ink2))" }}>{v}</span>
    </div>
  );
}
