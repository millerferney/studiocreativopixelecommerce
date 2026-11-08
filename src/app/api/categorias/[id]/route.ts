import { requerirUsuario } from "@/lib/auth";
import { api, idParam, leerJson, ok } from "@/lib/http";
import { actualizarCategoria, eliminarCategoria } from "@/server/services/catalogo";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = api<Ctx>(async (req, { params }) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await actualizarCategoria(idParam((await params).id), (await leerJson(req)) as never));
});
export const DELETE = api<Ctx>(async (_req, { params }) => {
  await requerirUsuario("ADMINISTRADOR");
  await eliminarCategoria(idParam((await params).id));
  return new Response(null, { status: 204 });
});
