import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { listarPedidosCliente } from "@/server/services/pedidos";

export const GET = api(async () => ok(await listarPedidosCliente((await requerirUsuario("CLIENTE")).idUsuario)));
