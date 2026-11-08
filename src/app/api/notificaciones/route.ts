import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { listarNotificaciones, marcarLeidas } from "@/server/services/notificaciones";

export const GET = api(async () => ok(await listarNotificaciones((await requerirUsuario()).idUsuario)));
export const POST = api(async () => {
  await marcarLeidas((await requerirUsuario()).idUsuario);
  return ok({ ok: true });
});
