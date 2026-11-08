import { requerirUsuario } from "@/lib/auth";
import { api, idParam, leerJson, ok } from "@/lib/http";
import { cambiarEstadoPedido } from "@/server/services/pedidos";

type Ctx = { params: Promise<{ id: string }> };
export const PATCH = api<Ctx>(async (req, { params }) => {
  const admin = await requerirUsuario("ADMINISTRADOR");
  return ok(await cambiarEstadoPedido(idParam((await params).id), await leerJson(req), admin));
});
