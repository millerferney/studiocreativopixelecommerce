"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export function MarcarLeidas() {
  const router = useRouter();
  return <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={async () => { await api("/api/notificaciones", { method: "POST" }); router.refresh(); }}>Marcar todas como leídas</button>;
}
