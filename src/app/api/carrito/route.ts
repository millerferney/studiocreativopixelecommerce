import { requerirUsuario } from "@/lib/auth";
import { api, leerJson, ok } from "@/lib/http";
import { guardarCarrito, obtenerCarrito } from "@/server/services/carrito";

export const GET = api(async () => ok({ items: await obtenerCarrito((await requerirUsuario("CLIENTE")).idUsuario) }));
export const PUT = api(async (req) => {
  const u = await requerirUsuario("CLIENTE");
  return ok({ items: await guardarCarrito(u.idUsuario, await leerJson(req)) });
});
