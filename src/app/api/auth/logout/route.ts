import { cerrarSesion } from "@/lib/auth";
import { api, ok } from "@/lib/http";

export const POST = api(async () => {
  await cerrarSesion();
  return ok({ ok: true });
});
