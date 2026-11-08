import { api, idParam, ok } from "@/lib/http";
import { listarServicios } from "@/server/services/catalogo";

type Ctx = { params: Promise<{ id: string }> };
export const GET = api<Ctx>(async (_req, { params }) => ok(await listarServicios({ idCategoria: idParam((await params).id), soloDisponibles: true })));
