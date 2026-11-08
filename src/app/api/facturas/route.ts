import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { listarFacturas } from "@/server/services/facturacion";

export const GET = api(async () => {
  const u = await requerirUsuario();
  return ok(await listarFacturas(u.roles.includes("ADMINISTRADOR") ? undefined : u.idUsuario));
});
