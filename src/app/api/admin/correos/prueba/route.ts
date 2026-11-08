import { requerirUsuario } from "@/lib/auth";
import { api, ok } from "@/lib/http";
import { correoPrueba } from "@/server/mail/correos";

// El administrador envía un correo de prueba a su propia cuenta para verificar MAIL_PROVIDER.
export const POST = api(async () => {
  const admin = await requerirUsuario("ADMINISTRADOR");
  return ok(await correoPrueba(admin.email, admin.idUsuario));
});
