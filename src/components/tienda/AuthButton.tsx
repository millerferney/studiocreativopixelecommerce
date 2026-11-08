"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/AppProviders";

/** Botón que abre el modal de autenticación (isla cliente dentro de páginas de servidor). */
export function AuthButton({ tab = "login", className, children }: { tab?: "login" | "register"; className?: string; children: ReactNode }) {
  const { abrirAuth, user } = useAuth();
  if (user) return null;
  return <button className={className} onClick={() => abrirAuth(tab)}>{children}</button>;
}
