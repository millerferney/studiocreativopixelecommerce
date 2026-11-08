import type { Metadata, Viewport } from "next";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/outfit";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { usuarioActual } from "@/lib/auth";
import { db } from "@/lib/db";
import { num } from "@/lib/money";

export const metadata: Metadata = {
  title: { default: "Studio Creativo Pixel — Sublimación, diseño y producción premium", template: "%s · Studio Creativo Pixel" },
  description: "Plataforma de sublimación, diseño y producción premium. Personaliza tazas, hoodies, gorras y más con precisión extrema.",
  icons: { icon: "/assets/brand/ICON_SP.svg" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};
export const viewport: Viewport = { themeColor: "#080B14", colorScheme: "dark light" };

// Se ejecuta ANTES de pintar: evita el parpadeo del tema equivocado. Orden: preferencia guardada → sistema → oscuro.
const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("scp_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"#FFFFFF":"#080B14")}catch(e){document.documentElement.dataset.theme="dark"}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [u, cfg] = await Promise.all([usuarioActual(), db.configuracionEmpresa.findUnique({ where: { id: 1 } })]);
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
        <AppProviders
          usuarioInicial={u ? { idUsuario: u.idUsuario, nombre: u.nombre, apellido: u.apellido, email: u.email, roles: u.roles } : null}
          ivaPct={num(cfg?.ivaPorcentaje ?? 19)}
          descPct={num(cfg?.descuentoPorcentaje ?? 5)}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
