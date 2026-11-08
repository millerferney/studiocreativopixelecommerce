import type { Metadata } from "next";
import { MarcarLeidas } from "@/components/tienda/MarcarLeidas";
import { requerirUsuario } from "@/lib/auth";
import { listarNotificaciones } from "@/server/services/notificaciones";

export const metadata: Metadata = { title: "Notificaciones" };
export const dynamic = "force-dynamic";

export default async function Notificaciones() {
  const u = await requerirUsuario();
  const items = await listarNotificaciones(u.idUsuario);
  const sinLeer = items.filter((n) => !n.leida).length;
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="font-body text-sm text-px-muted m-0">{sinLeer} sin leer</p>
        {sinLeer > 0 && <MarcarLeidas />}
      </div>
      {items.length === 0 && <div className="card bg-px-surface text-center p-10 font-body text-sm text-px-muted">No tienes notificaciones.</div>}
      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {items.map((n) => (
          <li key={n.idNotificacion} className="card bg-px-surface" style={n.leida ? undefined : { borderColor: "rgb(var(--c-cyan) / 0.4)" }}>
            <div className="flex justify-between gap-4">
              <span className="font-display font-bold text-sm text-fg">{n.titulo}</span>
              <span className="font-mono text-[10px] text-px-faint whitespace-nowrap">{new Date(n.createdAt).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" })}</span>
            </div>
            <p className="font-body text-sm text-px-muted m-0 mt-1">{n.mensaje}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
