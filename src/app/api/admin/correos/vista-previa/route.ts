import { requerirUsuario } from "@/lib/auth";
import { api, badRequest } from "@/lib/http";
import { vistaPrevia } from "@/server/mail/correos";

export const GET = api(async (req) => {
  await requerirUsuario("ADMINISTRADOR");
  const html = vistaPrevia(new URL(req.url).searchParams.get("plantilla") ?? "");
  if (!html) throw badRequest("Plantilla desconocida.");
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "default-src 'none'; img-src * data:; style-src 'unsafe-inline'",
    },
  });
});
