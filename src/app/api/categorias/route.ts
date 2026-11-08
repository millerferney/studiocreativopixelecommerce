import { requerirUsuario } from "@/lib/auth";
import { api, leerJson, ok } from "@/lib/http";
import { crearCategoria, listarCategorias } from "@/server/services/catalogo";

export const GET = api(async () => ok(await listarCategorias()));
export const POST = api(async (req) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await crearCategoria((await leerJson(req)) as never), 201);
});
