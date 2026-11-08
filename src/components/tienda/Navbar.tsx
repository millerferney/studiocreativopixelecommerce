"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuth, useCart } from "@/components/providers/AppProviders";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/catalogo", label: "Catálogo" },
];

export function Navbar() {
  const { cantidadTotal, abrir } = useCart();
  const { user, abrirAuth } = useAuth();
  const [menu, setMenu] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const pathname = usePathname();
  const userWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenu(false);
    setDropdown(false);
  }, [pathname]);

  // Cierra el dropdown al hacer clic fuera (igual que el prototipo)
  useEffect(() => {
    if (!dropdown) return;
    const fn = (e: MouseEvent) => {
      if (userWrap.current && !userWrap.current.contains(e.target as Node)) setDropdown(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [dropdown]);

  return (
    <>
      <nav
        id="navbar"
        className="fixed top-0 left-0 right-0 z-[1000] h-[60px] flex items-center justify-between px-6 bg-glass border-b border-fg border-opacity-5 transition-all"
      >
        <Link href="/" className="flex items-center gap-3 no-underline" aria-label="Studio Creativo Pixel — inicio">
          <span className="only-dark font-display font-bold text-base md:text-lg text-fg tracking-wide">
            Studio <span className="text-px-cyan">Creativo</span> <span className="text-px-green">Pixel</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/brand/LOGO2-FONDOBLANCO.svg" alt="Studio Creativo Pixel" className="only-light h-9 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-1 nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link font-body text-sm font-medium px-4 py-2 rounded-md hover:text-fg transition-colors ${
                (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)) ? "text-fg" : "text-px-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="cart-btn"
            onClick={abrir}
            aria-label={`Carrito de compras, ${cantidadTotal} ítem${cantidadTotal !== 1 ? "s" : ""}`}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg text-px-muted hover:text-fg hover:bg-fg hover:bg-opacity-10 transition-colors"
          >
            <Icon name="shopping-cart" className="w-5 h-5" />
            {cantidadTotal > 0 && (
              <span
                key={cantidadTotal}
                className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-px-cyan text-px-base text-[10px] font-mono font-bold rounded-full flex items-center justify-center"
                style={{ animation: "pop 0.3s ease" }}
              >
                {cantidadTotal}
              </span>
            )}
          </button>

          <ThemeToggle />

          <div ref={userWrap} className="relative">
            <button
              id="user-btn"
              onClick={() => (user ? setDropdown((d) => !d) : abrirAuth("login"))}
              aria-label={user ? "Mi cuenta" : "Iniciar sesión"}
              aria-expanded={user ? dropdown : undefined}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-fg border-opacity-[0.06] bg-px-elevated text-px-muted hover:text-px-text hover:border-opacity-40 transition-colors"
            >
              <Icon name={user ? "user-check" : "user"} className={`w-[18px] h-[18px] ${user ? "text-px-cyan" : ""}`} />
            </button>
            {user && dropdown && <UserMenu onCerrar={() => setDropdown(false)} />}
          </div>

          <button
            id="menu-btn"
            onClick={() => setMenu((m) => !m)}
            aria-label="Menú"
            aria-expanded={menu}
            className="md:hidden flex items-center justify-center w-10 h-10 text-px-muted hover:text-px-text"
          >
            <Icon name={menu ? "x" : "menu"} className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={menu ? "is-open" : ""} role="navigation" aria-label="Menú principal móvil">
        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={`block py-3 ${i < LINKS.length - 1 ? "border-b border-fg border-opacity-5" : ""} text-px-muted hover:text-fg font-body text-sm`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </>
  );
}
