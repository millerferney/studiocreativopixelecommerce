import { requerirUsuario } from "@/lib/auth";
import { api, idParam, leerJson, ok } from "@/lib/http";
import { actualizarServicio, eliminarServicio, obtenerServicio } from "@/server/services/catalogo";

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => ok(await obtenerServicio(idParam((await params).id))));
export const PUT = api<Ctx>(async (req, { params }) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await actualizarServicio(idParam((await params).id), await leerJson(req)));
});
export const DELETE = api<Ctx>(async (_req, { params }) => {
  await requerirUsuario("ADMINISTRADOR");
  await eliminarServicio(idParam((await params).id));
  return new Response(null, { status: 204 });
});
