import { api, leerJson, ok } from "@/lib/http";
import { registrar } from "@/server/services/usuarios";

export const POST = api(async (req) => ok(await registrar(await leerJson(req)), 201));
