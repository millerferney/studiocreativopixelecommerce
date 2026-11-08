"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export function Modal({ titulo, onCerrar, children, ancho = "max-w-lg" }: { titulo: string; onCerrar: () => void; children: ReactNode; ancho?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "Tab" && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>("button,input,select,textarea,a[href]");
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", fn);
    return () => { document.removeEventListener("keydown", fn); prev?.focus(); };
  }, [onCerrar]);
  return (
    <div className="adm-overlay" role="dialog" aria-modal="true" aria-label={titulo} onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={ref} className={`adm-modal-card ${ancho} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold m-0">{titulo}</h2>
          <button className="adm-btn-icon" aria-label="Cerrar" onClick={onCerrar}><Icon name="x" className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Campo({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="adm-field-label">{label}</label>
      {children}
      {error && <p role="alert" className="adm-field-error">{error}</p>}
    </div>
  );
}

export function Confirmar({ titulo, mensaje, onSi, onNo, cargando }: { titulo: string; mensaje: string; onSi: () => void; onNo: () => void; cargando?: boolean }) {
  return (
    <Modal titulo={titulo} onCerrar={onNo} ancho="max-w-md">
      <p className="font-body text-sm text-px-muted mb-6">{mensaje}</p>
      <div className="flex justify-end gap-3">
        <button className="adm-btn-secondary" onClick={onNo}>Cancelar</button>
        <button className="adm-btn-danger" onClick={onSi} disabled={cargando}>{cargando ? "Eliminando…" : "Eliminar"}</button>
      </div>
    </Modal>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <div className="text-center py-14 font-body text-sm text-px-faint">{texto}</div>;
}

export function Encabezado({ titulo, sub, accion }: { titulo: string; sub?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold m-0">{titulo}</h1>
        {sub && <p className="font-body text-sm text-px-muted mt-1 mb-0">{sub}</p>}
      </div>
      {accion}
    </div>
  );
}
