import { requerirUsuario } from "@/lib/auth";
import { api, idParam, leerJson, ok } from "@/lib/http";
import { actualizarUsuario, eliminarUsuario, obtenerUsuario } from "@/server/services/usuarios";

type Ctx = { params: Promise<{ id: string }> };

export const GET = api<Ctx>(async (_req, { params }) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await obtenerUsuario(idParam((await params).id)));
});
export const PUT = api<Ctx>(async (req, { params }) => {
  const admin = await requerirUsuario("ADMINISTRADOR");
  return ok(await actualizarUsuario(idParam((await params).id), await leerJson(req), admin.idUsuario));
});
export const DELETE = api<Ctx>(async (_req, { params }) => {
  const admin = await requerirUsuario("ADMINISTRADOR");
  await eliminarUsuario(idParam((await params).id), admin.idUsuario);
  return new Response(null, { status: 204 });
});
