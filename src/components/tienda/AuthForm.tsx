"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ApiClientError } from "@/lib/api-client";
import { useAuth, useToast } from "@/components/providers/AppProviders";

/** Formularios de login y registro (mismo markup/estilos del modal del prototipo). */
export function AuthForm({ tab, onTab, onListo, redirect }: { tab: "login" | "register"; onTab: (t: "login" | "register") => void; onListo: () => void; redirect?: string }) {
  const { iniciarSesion, registrar } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [rol, setRol] = useState<"CLIENTE" | "ADMINISTRADOR">("CLIENTE");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  const err = (k: string) => campos[k];
  const manejar = (e: unknown) => {
    if (e instanceof ApiClientError) {
      setCampos(e.fieldErrors ?? {});
      setError(e.fieldErrors ? null : e.message);
    } else setError("No se pudo completar la solicitud.");
  };

  async function enviarLogin(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    setCargando(true); setError(null); setCampos({});
    try {
      const u = await iniciarSesion(String(f.get("email")), String(f.get("password")), rol);
      toast("success", `Bienvenido, ${u.nombre}`);
      onListo();
      if (redirect) router.push(redirect);
      else if (u.roles.includes("ADMINISTRADOR") && rol === "ADMINISTRADOR") router.push("/admin");
    } catch (e) { manejar(e); } finally { setCargando(false); }
  }

  async function enviarRegistro(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    setCargando(true); setError(null); setCampos({});
    try {
      const u = await registrar({
        nombre: f.get("nombre"), apellido: f.get("apellido"), email: f.get("email"), password: f.get("password"),
        aceptaTerminos: f.get("terminos") === "on",
      });
      toast("success", `Cuenta creada. ¡Hola, ${u.nombre}!`);
      onListo();
      if (redirect) router.push(redirect);
    } catch (e) { manejar(e); } finally { setCargando(false); }
  }

  const tabStyle = (activo: boolean) => ({ color: activo ? "rgb(var(--c-cyan))" : "rgb(var(--c-subtle))", borderBottom: `2px solid ${activo ? "rgb(var(--c-cyan))" : "transparent"}`, background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" });
  const msg = (k: string) => err(k) && <p role="alert" className="font-body text-[11px] mt-1" style={{ color: "rgb(var(--c-danger))" }}>{err(k)}</p>;

  return (
    <>
      <div className="flex" style={{ borderBottom: "1px solid rgb(var(--c-fg) / calc(0.07 * var(--k)))" }}>
        <button type="button" onClick={() => { onTab("login"); setError(null); setCampos({}); }} className="flex-1 py-4 font-display text-sm font-bold transition-colors" style={tabStyle(tab === "login")}>Iniciar sesión</button>
        <button type="button" onClick={() => { onTab("register"); setError(null); setCampos({}); }} className="flex-1 py-4 font-display text-sm font-bold transition-colors" style={tabStyle(tab === "register")}>Registrarse</button>
      </div>

      {tab === "login" ? (
        <form onSubmit={enviarLogin} className="p-8" noValidate>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgb(var(--c-elevated))", border: "1px solid rgb(var(--c-fg) / calc(0.07 * var(--k)))", boxShadow: "0 0 20px rgb(var(--c-cyan) / 0.10)" }}>
              <Icon name="lock" style={{ width: 20, height: 20, color: "rgb(var(--c-cyan))" }} />
            </div>
            <h2 id="auth-title" className="font-display text-xl font-bold text-fg mb-1">Bienvenido de vuelta</h2>
            <p className="font-body text-sm text-px-muted">Ingresa tus credenciales para continuar</p>
          </div>

          <div className="flex rounded-lg overflow-hidden mb-5" style={{ background: "rgb(var(--c-base))", border: "1px solid rgb(var(--c-fg) / calc(0.06 * var(--k)))" }} role="tablist" aria-label="Tipo de cuenta">
            <button type="button" role="tab" aria-selected={rol === "CLIENTE"} onClick={() => setRol("CLIENTE")} className={`flex-1 py-2.5 text-xs font-bold font-display ${rol === "CLIENTE" ? "text-fg" : "text-px-faint hover:text-fg"}`} style={{ background: rol === "CLIENTE" ? "rgb(var(--c-elevated))" : "transparent", border: "none", cursor: "pointer" }}>CLIENTE</button>
            <button type="button" role="tab" aria-selected={rol === "ADMINISTRADOR"} onClick={() => setRol("ADMINISTRADOR")} className={`flex-1 py-2.5 text-xs font-bold font-display flex items-center justify-center gap-1 transition-colors ${rol === "ADMINISTRADOR" ? "text-fg" : "text-px-faint hover:text-fg"}`} style={{ background: rol === "ADMINISTRADOR" ? "rgb(var(--c-elevated))" : "transparent", border: "none", cursor: "pointer" }}>
              <Icon name="shield" style={{ width: 12, height: 12 }} /> ADMIN
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-4">
            <div>
              <label htmlFor="lg-email" className="font-mono text-[11px] text-px-faint uppercase mb-2 block">Correo electrónico</label>
              <input id="lg-email" name="email" type="email" className="field-input" placeholder="correo@studiopixel.com" autoComplete="email" required />
              {msg("email")}
            </div>
            <div>
              <label htmlFor="lg-pass" className="font-mono text-[11px] text-px-faint uppercase mb-2 block">Contraseña</label>
              <input id="lg-pass" name="password" type="password" className="field-input" placeholder="••••••••" autoComplete="current-password" required />
              {msg("password")}
            </div>
          </div>
          {error && <p role="alert" className="font-body text-xs mb-4" style={{ color: "rgb(var(--c-danger))" }}>{error}</p>}
          <button type="submit" disabled={cargando} className="btn-success w-full py-3.5 text-sm font-display font-bold tracking-wide">
            {cargando ? "Ingresando…" : "Iniciar Sesión"}
          </button>
        </form>
      ) : (
        <form onSubmit={enviarRegistro} className="p-8" noValidate>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "rgb(var(--c-elevated))", border: "1px solid rgb(var(--c-fg) / calc(0.07 * var(--k)))", boxShadow: "0 0 20px rgb(var(--c-purple) / 0.12)" }}>
              <Icon name="user-plus" style={{ width: 20, height: 20, color: "rgb(var(--c-purple))" }} />
            </div>
            <h2 id="auth-title" className="font-display text-xl font-bold text-fg mb-1">Crea tu cuenta</h2>
            <p className="font-body text-sm text-px-muted">Regístrate para acceder al catálogo exclusivo</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rg-nombre" className="font-mono text-[11px] text-px-faint uppercase mb-2 block">Nombres</label>
                <input id="rg-nombre" name="nombre" type="text" className="field-input" placeholder="Juan" autoComplete="given-name" required />
                {msg("nombre")}
              </div>
              <div>
                <label htmlFor="rg-apellido" className="font-mono text-[11px] text-px-faint uppercase mb-2 block">Apellidos</label>
                <input id="rg-apellido" name="apellido" type="text" className="field-input" placeholder="Pérez" autoComplete="family-name" />
                {msg("apellido")}
              </div>
            </div>
            <div>
              <label htmlFor="rg-email" className="font-mono text-[11px] text-px-faint uppercase mb-2 block">Correo electrónico</label>
              <input id="rg-email" name="email" type="email" className="field-input" placeholder="correo@ejemplo.com" autoComplete="email" required />
              {msg("email")}
            </div>
            <div>
              <label htmlFor="rg-pass" className="font-mono text-[11px] text-px-faint uppercase mb-2 block">Contraseña</label>
              <input id="rg-pass" name="password" type="password" className="field-input" placeholder="Mínimo 8 caracteres, con letras y números" autoComplete="new-password" required />
              {msg("password")}
            </div>
          </div>

          <label className="flex items-start gap-3 mt-5 mb-1 cursor-pointer">
            <input name="terminos" type="checkbox" className="mt-0.5 shrink-0" style={{ accentColor: "rgb(var(--c-cyan))" }} />
            <span className="font-body text-xs text-px-muted leading-relaxed">
              Acepto el tratamiento de mis datos conforme a la{" "}
              <a href="#" style={{ color: "rgb(var(--c-cyan))" }} className="hover:underline">Política de privacidad</a>
            </span>
          </label>
          {msg("aceptaTerminos")}
          {error && <p role="alert" className="font-body text-xs mt-3" style={{ color: "rgb(var(--c-danger))" }}>{error}</p>}
          <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5 text-sm font-display font-bold tracking-wide mt-5">
            {cargando ? "Creando cuenta…" : "Completar Registro"}
          </button>
        </form>
      )}
    </>
  );
}
