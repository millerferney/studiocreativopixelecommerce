import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { listarPedidosAdmin } from "@/server/services/pedidos";

export const GET = api(async (req) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await listarPedidosAdmin(new URL(req.url).searchParams.get("estado") ?? undefined));
});
