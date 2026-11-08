"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { formatCOP } from "@/lib/money";
import { Icon } from "@/components/ui/Icon";
import { PAGO_INICIAL, PagoForm, pagoAPayload, type EstadoPago } from "./PagoForm";

export function ReintentarPago({ idPedido, numero, total }: { idPedido: number; numero: string; total: number }) {
  const router = useRouter();
  const [pago, setPago] = useState<EstadoPago>(PAGO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setCargando(true); setError(null); setErrores({});
    try {
      const r = await api<{ pago: { aprobado: boolean; mensaje: string } }>(`/api/pedidos/${idPedido}/pagar`, { body: { pago: pagoAPayload(pago) } });
      if (r.pago.aprobado) router.push(`/checkout/confirmacion/${numero}`);
      else setError(r.pago.mensaje + " Prueba con otro medio de pago.");
    } catch (e) {
      if (e instanceof ApiClientError) { setErrores(e.fieldErrors ?? {}); setError(e.fieldErrors ? "Revisa los campos marcados." : e.message); }
      else setError("No se pudo procesar el pago.");
    } finally { setCargando(false); }
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-[640px]">
      <div className="card bg-px-surface mb-8 flex justify-between items-center">
        <span className="font-mono text-sm text-px-muted">{numero}</span>
        <span className="font-display font-bold text-2xl text-px-cyan">{formatCOP(total)}</span>
      </div>
      <PagoForm valor={pago} onChange={setPago} errores={errores} />
      {error && <div role="alert" className="mt-6 p-4 font-body text-sm" style={{ border: "1px solid rgb(var(--c-danger) / 0.4)", background: "rgb(var(--c-danger) / 0.08)", color: "rgb(var(--c-dsoft))" }}>{error}</div>}
      <button type="submit" disabled={cargando} className="mt-8 w-full bg-px-green text-onaccent font-display font-bold text-lg py-4 flex items-center justify-center gap-3 disabled:opacity-60">
        {cargando ? <>PROCESANDO… <Icon name="loader-circle" className="w-5 h-5 animate-spin" /></> : <>PAGAR AHORA <Icon name="arrow-right" className="w-5 h-5" /></>}
      </button>
    </form>
  );
}
