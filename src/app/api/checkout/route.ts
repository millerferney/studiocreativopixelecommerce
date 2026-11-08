import { requerirUsuario } from "@/lib/auth";
import { api, leerJson, ok } from "@/lib/http";
import { realizarCheckout } from "@/server/services/pedidos";

export const POST = api(async (req) => {
  const u = await requerirUsuario("CLIENTE");
  const r = await realizarCheckout(u, await leerJson(req));
  // 200 aunque el pago sea rechazado: el pedido se creó y se puede reintentar (r.pago.aprobado = false)
  return ok(r, 201);
});
