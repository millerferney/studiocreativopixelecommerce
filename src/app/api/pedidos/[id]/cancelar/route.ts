import { requerirUsuario } from "@/lib/auth";
import { api, idParam, ok } from "@/lib/http";
import { cancelarPedidoCliente } from "@/server/services/pedidos";

type Ctx = { params: Promise<{ id: string }> };
export const POST = api<Ctx>(async (_req, { params }) => ok(await cancelarPedidoCliente(idParam((await params).id), await requerirUsuario("CLIENTE"))));
