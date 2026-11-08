import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { usuarioActual } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Panel administrativo", template: "%s · Pixel Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioActual();
  if (!u) redirect("/login?redirect=/admin");
  if (!u.roles.includes("ADMINISTRADOR")) redirect("/");
  return <AdminShell>{children}</AdminShell>;
}
