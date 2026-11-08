"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { mensajeError, useToast } from "@/components/providers/AppProviders";

const SIGUIENTES: Record<string, { estado: string; label: string }[]> = {
  PENDIENTE: [{ estado: "CANCELADO", label: "Cancelar pedido" }],
  PAGADO: [{ estado: "EN_DISENO", label: "Pasar a diseño" }, { estado: "EN_PRODUCCION", label: "Pasar a producción" }],
  EN_DISENO: [{ estado: "EN_PRODUCCION", label: "Pasar a producción" }],
  EN_PRODUCCION: [{ estado: "ENVIADO", label: "Marcar enviado" }],
  ENVIADO: [{ estado: "RECIBIDO", label: "Marcar recibido" }],
};

export function PedidoAcciones({ idPedido, estado, tienePagoAprobado, tieneFactura }: { idPedido: number; estado: string; tienePagoAprobado: boolean; tieneFactura: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [comentario, setComentario] = useState("");
  const [cargando, setCargando] = useState<string | null>(null);
  const opciones = SIGUIENTES[estado] ?? [];

  async function cambiar(nuevo: string) {
    if (nuevo === "CANCELADO" && !confirm("¿Cancelar este pedido?")) return;
    setCargando(nuevo);
    try { await api(`/api/admin/pedidos/${idPedido}/estado`, { method: "PATCH", body: { estado: nuevo, comentario } }); toast("success", "Estado actualizado; se notificó al cliente."); setComentario(""); router.refresh(); }
    catch (e) { toast("error", mensajeError(e)); } finally { setCargando(null); }
  }
  async function facturar() {
    setCargando("factura");
    try { await api(`/api/admin/pedidos/${idPedido}/facturar`, { method: "POST" }); toast("success", "Factura emitida."); router.refresh(); }
    catch (e) { toast("error", mensajeError(e)); } finally { setCargando(null); }
  }

  if (opciones.length === 0 && !(tienePagoAprobado && !tieneFactura)) return null;
  return (
    <div className="adm-card mb-8">
      <h2 className="font-display text-lg font-bold mb-4">Acciones</h2>
      {opciones.length > 0 && (
        <>
          <label htmlFor="pd-com" className="adm-field-label">Comentario para el historial (opcional)</label>
          <input id="pd-com" className="adm-field-input mb-4" maxLength={255} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </>
      )}
      <div className="flex flex-wrap gap-3">
        {opciones.map((o) => (
          <button key={o.estado} className={o.estado === "CANCELADO" ? "adm-btn-danger" : "adm-btn-primary"} disabled={!!cargando} onClick={() => cambiar(o.estado)}>{cargando === o.estado ? "Actualizando…" : o.label}</button>
        ))}
        {tienePagoAprobado && !tieneFactura && <button className="adm-btn-secondary" disabled={!!cargando} onClick={facturar}>{cargando === "factura" ? "Emitiendo…" : "Emitir factura electrónica"}</button>}
      </div>
    </div>
  );
}
