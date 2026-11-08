import { requerirUsuario } from "@/lib/auth";
import { api, leerJson, ok } from "@/lib/http";
import { fusionarCarrito } from "@/server/services/carrito";

export const POST = api(async (req) => {
  const u = await requerirUsuario("CLIENTE");
  return ok({ items: await fusionarCarrito(u.idUsuario, await leerJson(req)) });
});
