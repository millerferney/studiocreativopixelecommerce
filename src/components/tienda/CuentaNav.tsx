"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/cuenta/pedidos", label: "Pedidos" },
  { href: "/cuenta/facturas", label: "Facturas" },
  { href: "/cuenta/notificaciones", label: "Notificaciones" },
];

export function CuentaNav() {
  const p = usePathname();
  return (
    <nav aria-label="Secciones de mi cuenta" className="flex gap-2 border-b border-fg border-opacity-[0.06] mb-8 overflow-x-auto">
      {TABS.map((t) => {
        const activo = p.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={activo ? "page" : undefined} className="font-display text-sm font-bold px-4 py-3 whitespace-nowrap" style={{ color: activo ? "rgb(var(--c-cyan))" : "rgb(var(--c-subtle))", borderBottom: `2px solid ${activo ? "rgb(var(--c-cyan))" : "transparent"}` }}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
