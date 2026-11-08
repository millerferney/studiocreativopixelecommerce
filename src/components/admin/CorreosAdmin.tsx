"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { mensajeError, useToast } from "@/components/providers/AppProviders";
import { Encabezado, Vacio } from "./ui";

interface Correo { idCorreo: number; destinatario: string; plantilla: string; asunto: string; estado: string; proveedor: string; error: string | null; createdAt: string }

const COLOR: Record<string, string> = { ENVIADO: "adm-badge-green", ERROR: "adm-badge-danger", OMITIDO: "adm-badge-purple" };

export function CorreosAdmin({
  correos,
  proveedor,
  remitente,
  plantillas,
  previews,
}: {
  correos: Correo[];
  proveedor: string;
  remitente: string;
  plantillas: readonly string[];
  previews?: Record<string, string>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [probando, setProbando] = useState(false);
  const [vista, setVista] = useState<string>(plantillas[1] ?? plantillas[0]);

  async function probar() {
    setProbando(true);
    try {
      const r = await api<{ estado: string; error?: string }>("/api/admin/correos/prueba", { method: "POST" });
      if (r.estado === "ENVIADO") toast("success", "Correo de prueba enviado a tu cuenta de administrador.");
      else if (r.estado === "OMITIDO") toast("info", "MAIL_PROVIDER=CONSOLE: no se envía nada, solo se registra en el log.");
      else toast("error", r.error ?? "No se pudo enviar el correo.");
      router.refresh();
    } catch (e) { toast("error", mensajeError(e)); } finally { setProbando(false); }
  }

  return (
    <section>
      <Encabezado titulo="Correos transaccionales" sub="Confirmaciones de pago, facturas y avances del pedido" accion={<button className="adm-btn-primary" onClick={probar} disabled={probando}>{probando ? "Enviando…" : "Enviar correo de prueba"}</button>} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="adm-card">
          <h2 className="font-display text-lg font-bold mb-3">Configuración</h2>
          <dl className="m-0 grid gap-3 font-body text-sm">
            <div><dt className="adm-field-label">Proveedor</dt><dd className="m-0 font-mono">{proveedor}{proveedor === "CONSOLE" && <span className="adm-badge adm-badge-purple ml-2">sin envío real</span>}</dd></div>
            <div><dt className="adm-field-label">Remitente</dt><dd className="m-0 font-mono text-xs break-all">{remitente}</dd></div>
          </dl>
          <p className="font-body text-xs text-px-faint mt-4 mb-0">Se cambia con las variables <code>MAIL_PROVIDER</code> (CONSOLE, RESEND o SMTP) y <code>MAIL_FROM</code>. Ver README.</p>
        </div>
        <div className="adm-card xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-lg font-bold m-0">Vista previa de plantillas</h2>
            <select aria-label="Plantilla" className="adm-field-select w-56" value={vista} onChange={(e) => setVista(e.target.value)}>
              {plantillas.map((p) => <option key={p} value={p}>{p.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <iframe
            title={`Vista previa ${vista}`}
            srcDoc={previews?.[vista]}
            src={!previews ? `/api/admin/correos/vista-previa?plantilla=${vista}` : undefined}
            sandbox="allow-same-origin allow-popups"
            className="w-full h-[520px] rounded-lg border border-px-border bg-white shadow-inner"
          />
        </div>
      </div>

      <div className="adm-card p-0 overflow-x-auto">
        {correos.length === 0 ? <Vacio texto="Aún no se ha enviado ningún correo." /> : (
          <table className="adm-table-shell">
            <caption className="sr-only">Registro de correos enviados</caption>
            <thead><tr><th scope="col">Fecha</th><th scope="col">Plantilla</th><th scope="col">Destinatario</th><th scope="col">Estado</th><th scope="col">Detalle</th></tr></thead>
            <tbody>
              {correos.map((c) => (
                <tr key={c.idCorreo}>
                  <td className="font-mono text-xs text-px-muted whitespace-nowrap">{c.createdAt.slice(0, 16).replace("T", " ")}</td>
                  <td className="font-mono text-xs">{c.plantilla}</td>
                  <td className="text-px-muted">{c.destinatario}<div className="text-xs text-px-faint truncate max-w-[320px]">{c.asunto}</div></td>
                  <td><span className={`adm-badge ${COLOR[c.estado]}`}>{c.estado}</span> <span className="font-mono text-[10px] text-px-faint">{c.proveedor}</span></td>
                  <td className="text-xs text-px-danger max-w-[280px]">{c.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
