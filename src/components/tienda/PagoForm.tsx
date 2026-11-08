"use client";

import { Icon } from "@/components/ui/Icon";

export const BANCOS_PSE = ["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA Colombia", "Banco de Occidente", "Nequi", "Banco Pruebas (rechaza)"];

export interface EstadoPago {
  metodo: "PSE" | "TARJETA";
  numero: string;
  expiracion: string;
  cvv: string;
  banco: string;
  tipoPersona: "NATURAL" | "JURIDICA";
}
export const PAGO_INICIAL: EstadoPago = { metodo: "TARJETA", numero: "", expiracion: "", cvv: "", banco: "", tipoPersona: "NATURAL" };

export const agruparTarjeta = (v: string) => v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
export const formatoExp = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Selector de método (PSE / tarjeta) + campos del medio de pago. Mismo diseño de checkout.html. */
export function PagoForm({ valor, onChange, errores }: { valor: EstadoPago; onChange: (v: EstadoPago) => void; errores: Record<string, string> }) {
  const set = (p: Partial<EstadoPago>) => onChange({ ...valor, ...p });
  const msg = (k: string) => errores[k] && <p role="alert" className="font-mono text-[10px] mt-2" style={{ color: "rgb(var(--c-danger))" }}>{errores[k]}</p>;
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup" aria-label="Método de pago">
        <button type="button" role="radio" aria-checked={valor.metodo === "PSE"} className={`payment-card text-left ${valor.metodo === "PSE" ? "active" : ""}`} onClick={() => set({ metodo: "PSE" })}>
          <Icon name="building" className={`w-8 h-8 mb-6 ${valor.metodo === "PSE" ? "text-px-green" : "text-fg"}`} />
          <div className="payment-card-badge"><Icon name="check" className="w-3 h-3 text-onaccent" /></div>
          <h3 className={`font-display font-bold text-base m-0 mb-1 ${valor.metodo === "PSE" ? "text-px-green" : "text-fg"}`}>PSE (Débito)</h3>
          <p className="font-mono text-[10px] text-px-faint m-0 uppercase">TRANSFERENCIA INSTANTÁNEA</p>
        </button>
        <button type="button" role="radio" aria-checked={valor.metodo === "TARJETA"} className={`payment-card text-left ${valor.metodo === "TARJETA" ? "active" : ""}`} onClick={() => set({ metodo: "TARJETA" })}>
          <Icon name="credit-card" className={`w-8 h-8 mb-6 ${valor.metodo === "TARJETA" ? "text-px-green" : "text-fg"}`} />
          <div className="payment-card-badge"><Icon name="check" className="w-3 h-3 text-onaccent" /></div>
          <h3 className={`font-display font-bold text-base m-0 mb-1 ${valor.metodo === "TARJETA" ? "text-px-green" : "text-fg"}`}>Tarjeta de Crédito / Débito</h3>
          <p className="font-mono text-[10px] text-px-muted m-0 uppercase">VISA, MASTERCARD, AMEX</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mt-8">
        {valor.metodo === "TARJETA" ? (
          <>
            <div className="md:col-span-2">
              <label htmlFor="pg-num" className="checkout-label">NÚMERO DE TARJETA</label>
              <div className="relative">
                <input id="pg-num" className="checkout-input" inputMode="numeric" autoComplete="cc-number" placeholder="XXXX XXXX XXXX XXXX" value={valor.numero} onChange={(e) => set({ numero: agruparTarjeta(e.target.value) })} />
                <Icon name="credit-card" className="absolute right-4 top-[14px] w-5 h-5 text-px-cyan opacity-40" />
              </div>
              {msg("pago.numero")}
            </div>
            <div>
              <label htmlFor="pg-exp" className="checkout-label">VENCIMIENTO</label>
              <input id="pg-exp" className="checkout-input" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} value={valor.expiracion} onChange={(e) => set({ expiracion: formatoExp(e.target.value) })} />
              {msg("pago.expiracion")}
            </div>
            <div>
              <label htmlFor="pg-cvv" className="checkout-label">CVC / CVV</label>
              <input id="pg-cvv" type="password" className="checkout-input" inputMode="numeric" autoComplete="cc-csc" placeholder="***" maxLength={4} value={valor.cvv} onChange={(e) => set({ cvv: e.target.value.replace(/\D/g, "") })} />
              {msg("pago.cvv")}
            </div>
            <p className="md:col-span-2 font-mono text-[10px] text-px-faint leading-relaxed">
              MODO DE PRUEBAS · Aprobada: 4242 4242 4242 4242 · Rechazada: 4000 0000 0000 0002 · Sin fondos: 4000 0000 0000 9995 · cualquier fecha futura y CVV.
              Los datos de la tarjeta no se almacenan.
            </p>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="pg-banco" className="checkout-label">BANCO</label>
              <select id="pg-banco" className="checkout-input" value={valor.banco} onChange={(e) => set({ banco: e.target.value })}>
                <option value="">SELECCIONA TU BANCO</option>
                {BANCOS_PSE.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              {msg("pago.banco")}
            </div>
            <div>
              <label htmlFor="pg-persona" className="checkout-label">TIPO DE PERSONA</label>
              <select id="pg-persona" className="checkout-input" value={valor.tipoPersona} onChange={(e) => set({ tipoPersona: e.target.value as "NATURAL" | "JURIDICA" })}>
                <option value="NATURAL">PERSONA NATURAL</option>
                <option value="JURIDICA">PERSONA JURÍDICA</option>
              </select>
            </div>
            <p className="md:col-span-2 font-mono text-[10px] text-px-faint leading-relaxed">MODO DE PRUEBAS · El banco «Banco Pruebas (rechaza)» simula una transacción PSE rechazada.</p>
          </>
        )}
      </div>
    </>
  );
}

export function pagoAPayload(p: EstadoPago) {
  return p.metodo === "TARJETA"
    ? { metodo: "TARJETA" as const, numero: p.numero, expiracion: p.expiracion, cvv: p.cvv }
    : { metodo: "PSE" as const, banco: p.banco, tipoPersona: p.tipoPersona };
}
