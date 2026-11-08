"use client";
import { Icon } from "@/components/ui/Icon";

export function PrintButton() {
  return <button className="btn-primary flex items-center gap-2" onClick={() => window.print()}><Icon name="download" className="w-4 h-4" /> Imprimir / Guardar PDF</button>;
}
