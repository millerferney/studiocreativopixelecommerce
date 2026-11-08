import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { CuentaNav } from "@/components/tienda/CuentaNav";

export default async function CuentaLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioActual();
  if (!u) redirect("/login?redirect=/cuenta/pedidos");
  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1000px] mx-auto">
      <span className="font-mono text-[10px] font-bold text-px-cyan uppercase tracking-[0.2em] block mb-2">MI CUENTA</span>
      <h1 className="font-display font-bold text-4xl m-0 mb-1">Hola, {u.nombre}.</h1>
      <p className="font-body text-sm text-px-muted mb-8">{u.email}</p>
      <CuentaNav />
      {children}
    </main>
  );
}
