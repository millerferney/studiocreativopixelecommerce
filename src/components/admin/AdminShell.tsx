"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuth } from "@/components/providers/AppProviders";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: "layout-dashboard", exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: "clipboard-list" },
  { href: "/admin/pagos", label: "Pagos", icon: "wallet" },
  { href: "/admin/facturas", label: "Facturas", icon: "receipt" },
  { href: "/admin/correos", label: "Correos", icon: "mail" },
  { href: "/admin/categorias", label: "Categorías", icon: "tags" },
  { href: "/admin/servicios", label: "Servicios y productos", icon: "package" },
  { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, cerrarSesion } = useAuth();
  const [abierta, setAbierta] = useState(false);
  useEffect(() => setAbierta(false), [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      {abierta && <div className="fixed inset-0 bg-scrim/60 z-[1500] lg:hidden" onClick={() => setAbierta(false)} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-[1600] h-screen w-64 shrink-0 bg-px-surface border-r border-px-border flex flex-col transition-transform ${abierta ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} aria-label="Navegación del panel">
        <div className="px-5 py-5 border-b border-px-border">
          <Link href="/admin" className="block no-underline" aria-label="Pixel Admin — inicio">
            <span className="only-dark font-display font-bold text-base text-fg">Pixel <span className="text-px-cyan">Admin</span></span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/LOGO2-FONDOBLANCO.svg" alt="Studio Creativo Pixel" className="only-light h-8 w-auto" />
          </Link>
          <p className="font-mono text-[10px] text-px-faint uppercase tracking-widest m-0 mt-1">Studio Creativo Pixel</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {NAV.map((n) => {
            const activo = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors ${activo ? "bg-px-elevated text-px-cyan" : "text-px-muted hover:text-fg hover:bg-fg/5"}`}>
                <Icon name={n.icon} className="w-4 h-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-px-border">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm text-px-muted hover:text-fg hover:bg-fg/5"><Icon name="store" className="w-4 h-4" />Ver tienda</Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-[1400] h-14 flex items-center justify-between px-5 lg:px-8 bg-px-base/90 backdrop-blur border-b border-px-border">
          <button className="lg:hidden adm-btn-icon" aria-label="Abrir menú" onClick={() => setAbierta(true)}><Icon name="menu" className="w-5 h-5" /></button>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right leading-tight">
              <div className="font-display text-sm font-semibold">{user?.nombre} {user?.apellido ?? ""}</div>
              <div className="font-mono text-[10px] text-px-cyan uppercase">Administrador</div>
            </div>
            <button className="adm-btn-icon" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={cerrarSesion}><Icon name="log-out" className="w-4 h-4" /></button>
          </div>
        </header>
        <main id="main-content" className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
