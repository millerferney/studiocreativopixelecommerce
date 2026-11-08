"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { mensajeError, useToast } from "@/components/providers/AppProviders";

export function CancelarPedido({ idPedido }: { idPedido: number }) {
  const router = useRouter();
  const toast = useToast();
  const [cargando, setCargando] = useState(false);
  async function cancelar() {
    if (!confirm("¿Cancelar este pedido? Esta acción no se puede deshacer.")) return;
    setCargando(true);
    try {
      await api(`/api/pedidos/${idPedido}/cancelar`, { method: "POST" });
      toast("info", "Pedido cancelado.");
      router.refresh();
    } catch (e) { toast("error", mensajeError(e)); } finally { setCargando(false); }
  }
  return <button onClick={cancelar} disabled={cargando} className="btn-secondary" style={{ color: "rgb(var(--c-danger))", borderColor: "rgb(var(--c-danger) / 0.4)" }}>{cargando ? "Cancelando…" : "Cancelar pedido"}</button>;
}
