"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export const CLAVE_TEMA = "scp_theme";

/** Alterna entre tema oscuro y claro. La preferencia se guarda; sin preferencia se sigue la del sistema (ver script en el layout). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<"dark" | "light" | null>(null);
  useEffect(() => setTema(document.documentElement.dataset.theme === "light" ? "light" : "dark"), []);

  function alternar() {
    const nuevo = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nuevo;
    try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch { /* almacenamiento bloqueado */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nuevo === "light" ? "#FFFFFF" : "#080B14");
    setTema(nuevo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "light" ? "Cambiar a tema oscuro" : tema === "dark" ? "Cambiar a tema claro" : "Cambiar tema"}
      title={tema === "light" ? "Tema oscuro" : "Tema claro"}
      className={`flex items-center justify-center w-10 h-10 rounded-lg text-px-muted hover:text-fg hover:bg-fg hover:bg-opacity-10 transition-colors ${className}`}
    >
      {/* En oscuro se muestra el sol (pasar a claro); en claro, la luna (pasar a oscuro) */}
      <span className="only-dark"><Icon name="sun" className="w-5 h-5" /></span>
      <span className="only-light"><Icon name="moon" className="w-5 h-5" /></span>
    </button>
  );
}
