import { requerirUsuario } from "@/lib/auth";
import { api, badRequest } from "@/lib/http";
import { vistaPrevia } from "@/server/mail/correos";

export const GET = api(async (req) => {
  await requerirUsuario("ADMINISTRADOR");
  const html = vistaPrevia(new URL(req.url).searchParams.get("plantilla") ?? "");
  if (!html) throw badRequest("Plantilla desconocida.");
  // CSP sandbox: la vista previa no puede ejecutar scripts ni acceder a la sesión
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "sandbox; default-src 'none'; img-src * data:; style-src 'unsafe-inline'" } });
});
