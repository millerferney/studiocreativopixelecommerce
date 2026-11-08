import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { resumenDashboard } from "@/server/services/dashboard";

export const GET = api(async () => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await resumenDashboard());
});
