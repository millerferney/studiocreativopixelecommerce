import { requerirUsuario } from "@/lib/auth";
import { api, idParam, ok } from "@/lib/http";
import { obtenerPedido } from "@/server/services/pedidos";

type Ctx = { params: Promise<{ id: string }> };
export const GET = api<Ctx>(async (_req, { params }) => ok(await obtenerPedido(idParam((await params).id), await requerirUsuario())));
