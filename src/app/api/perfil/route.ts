import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { perfilCliente } from "@/server/services/usuarios";

export const GET = api(async () => ok(await perfilCliente((await requerirUsuario()).idUsuario)));
