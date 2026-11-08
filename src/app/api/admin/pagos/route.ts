import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { listarPagos } from "@/server/services/pedidos";

export const GET = api(async () => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await listarPagos());
});
