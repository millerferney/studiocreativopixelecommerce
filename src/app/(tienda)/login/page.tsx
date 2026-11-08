import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPage } from "@/components/tienda/LoginPage";
import { usuarioActual } from "@/lib/auth";

export const metadata: Metadata = { title: "Iniciar sesión" };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect: destino } = await searchParams;
  // Solo rutas internas (evita open-redirect)
  const seguro = destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : undefined;
  const u = await usuarioActual();
  if (u) redirect(seguro ?? (u.roles.includes("ADMINISTRADOR") ? "/admin" : "/cuenta/pedidos"));
  return <LoginPage redirect={seguro} />;
}
