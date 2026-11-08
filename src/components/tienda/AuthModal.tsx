"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AppProviders";
import { Icon } from "@/components/ui/Icon";
import { AuthForm } from "./AuthForm";
import { useState } from "react";

export function AuthModal() {
  const { authAbierto, authTab, cerrarAuth } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");

  useEffect(() => setTab(authTab), [authTab, authAbierto]);
  useEffect(() => {
    if (!authAbierto) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && cerrarAuth();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [authAbierto, cerrarAuth]);

  if (!authAbierto) return null;
  return (
    <div id="auth-overlay" className="overlay is-open" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(e) => e.target === e.currentTarget && cerrarAuth()}>
      <div className="modal-card bg-px-surface rounded-[20px] w-full max-w-[440px] relative max-h-[92vh] overflow-y-auto" style={{ border: "1px solid rgb(var(--c-fg) / calc(0.07 * var(--k)))", boxShadow: "0 24px 64px rgb(var(--c-scrim) / calc(0.85 * var(--ks)))" }}>
        <button onClick={cerrarAuth} aria-label="Cerrar" className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-px-muted hover:text-fg hover:bg-fg hover:bg-opacity-10 transition-colors z-10">
          <Icon name="x" style={{ width: 18, height: 18 }} />
        </button>
        <AuthForm tab={tab} onTab={setTab} onListo={cerrarAuth} />
      </div>
    </div>
  );
}
