import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { obtenerUsuario } from "@/server/services/usuarios";

export const GET = api(async () => {
  const u = await requerirUsuario();
  return ok(await obtenerUsuario(u.idUsuario));
});
