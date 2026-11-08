import { requerirUsuario } from "@/lib/auth";
import { api, badRequest, ok } from "@/lib/http";
import { subirDiseno } from "@/server/storage/supabase";

export const POST = api(async (req) => {
  const u = await requerirUsuario("CLIENTE");
  const form = await req.formData();
  const file = form.get("archivo");
  if (!(file instanceof File)) throw badRequest("Adjunta un archivo en el campo \"archivo\".");
  return ok(await subirDiseno(u.idUsuario, file), 201);
});
