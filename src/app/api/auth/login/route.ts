import { api, leerJson, ok } from "@/lib/http";
import { iniciarSesion } from "@/server/services/usuarios";

export const POST = api(async (req) => {
  const body = (await leerJson(req)) as { rol?: string };
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rol = body?.rol === "ADMINISTRADOR" ? "ADMINISTRADOR" : undefined;
  return ok(await iniciarSesion(body, ip, rol));
});
