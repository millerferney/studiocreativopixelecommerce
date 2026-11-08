import type { Metadata } from "next";
import { UsuariosAdmin } from "@/components/admin/UsuariosAdmin";
import { requerirUsuario } from "@/lib/auth";
import { listarUsuarios } from "@/server/services/usuarios";

export const metadata: Metadata = { title: "Usuarios" };
export default async function Page() {
  const yo = await requerirUsuario("ADMINISTRADOR");
  return <UsuariosAdmin usuarios={await listarUsuarios()} yo={yo.idUsuario} />;
}
