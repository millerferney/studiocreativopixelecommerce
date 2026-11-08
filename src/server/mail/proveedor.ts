import "server-only";
import nodemailer from "nodemailer";

export interface Adjunto { nombre: string; contenido: string | Buffer; tipo: string }
export interface MensajeCorreo { para: string; asunto: string; html: string; texto: string; adjuntos?: Adjunto[] }
export interface ResultadoEnvio { estado: "ENVIADO" | "ERROR" | "OMITIDO"; proveedor: string; idExterno?: string; error?: string }

/**
 * Proveedores de correo (variable MAIL_PROVIDER):
 *   CONSOLE (por defecto) → no envía; imprime el asunto en el log. Ideal para desarrollo.
 *   RESEND                → API HTTPS de Resend (RESEND_API_KEY). Recomendado en Vercel.
 *   SMTP                  → cualquier servidor SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE).
 * Un fallo de envío NUNCA debe romper la compra: aquí se captura y se devuelve como ERROR.
 */
export const nombreProveedor = () => (process.env.MAIL_PROVIDER ?? "CONSOLE").toUpperCase();
export const remitente = () => process.env.MAIL_FROM ?? "Studio Creativo Pixel <no-reply@localhost>";

export async function enviarMensaje(m: MensajeCorreo): Promise<ResultadoEnvio> {
  const proveedor = nombreProveedor();
  try {
    if (proveedor === "CONSOLE") {
      console.log(`[correo:CONSOLE] para=${m.para} asunto="${m.asunto}" adjuntos=${m.adjuntos?.length ?? 0}`);
      return { estado: "OMITIDO", proveedor };
    }

    if (proveedor === "RESEND") {
      const key = process.env.RESEND_API_KEY;
      if (!key) return { estado: "ERROR", proveedor, error: "Falta RESEND_API_KEY" };
      const res = await fetch(`${process.env.RESEND_API_URL ?? "https://api.resend.com"}/emails`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: remitente(),
          to: [m.para],
          subject: m.asunto,
          html: m.html,
          text: m.texto,
          ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
          ...(m.adjuntos?.length ? { attachments: m.adjuntos.map((a) => ({ filename: a.nombre, content: Buffer.from(a.contenido).toString("base64") })) } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const cuerpo = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok) return { estado: "ERROR", proveedor, error: `HTTP ${res.status}: ${cuerpo.message ?? "respuesta inesperada"}`.slice(0, 480) };
      return { estado: "ENVIADO", proveedor, idExterno: cuerpo.id };
    }

    if (proveedor === "SMTP") {
      const host = process.env.SMTP_HOST;
      if (!host) return { estado: "ERROR", proveedor, error: "Falta SMTP_HOST" };
      const port = Number(process.env.SMTP_PORT ?? 587);
      const transporte = nodemailer.createTransport({
        host, port,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
        connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000,
      });
      const info = await transporte.sendMail({
        from: remitente(), to: m.para, subject: m.asunto, html: m.html, text: m.texto,
        replyTo: process.env.MAIL_REPLY_TO || undefined,
        attachments: m.adjuntos?.map((a) => ({ filename: a.nombre, content: a.contenido, contentType: a.tipo })),
      });
      return { estado: "ENVIADO", proveedor, idExterno: String(info.messageId ?? "").slice(0, 100) };
    }

    return { estado: "ERROR", proveedor, error: `MAIL_PROVIDER "${proveedor}" no soportado (usa CONSOLE, RESEND o SMTP)` };
  } catch (e) {
    return { estado: "ERROR", proveedor, error: (e instanceof Error ? e.message : "Error desconocido").slice(0, 480) };
  }
}
