import { requerirUsuario } from "@/lib/auth";
import { api, leerJson, ok } from "@/lib/http";
import { crearUsuario, listarUsuarios } from "@/server/services/usuarios";

export const GET = api(async () => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await listarUsuarios());
});
export const POST = api(async (req) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await crearUsuario(await leerJson(req)), 201);
});
