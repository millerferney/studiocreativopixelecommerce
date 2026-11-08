"use client";

import { useMemo, useState } from "react";
import type { ServicioDTO } from "@/server/dto";
import { ProductCard } from "./ProductCard";

const ETIQUETA: Record<string, string> = { Tazas: "Tazas y Mugs", Ropa: "Ropa y Textiles" };

export function CatalogoClient({ productos, categorias }: { productos: ServicioDTO[]; categorias: { idCategoria: number; nombre: string }[] }) {
  const [cat, setCat] = useState("all");
  const [orden, setOrden] = useState("none");

  const lista = useMemo(() => {
    let r = cat === "all" ? [...productos] : productos.filter((p) => String(p.idCategoria) === cat);
    if (orden === "desc") r.sort((a, b) => b.precio - a.precio);
    if (orden === "asc") r.sort((a, b) => a.precio - b.precio);
    return r;
  }, [productos, cat, orden]);

  return (
    <section id="sec-catalogo">
      <div className="flex justify-between items-end border-b border-fg border-opacity-5 pb-6 mb-10 flex-wrap">
        <div>
          <span className="text-px-cyan font-mono text-xs font-bold uppercase tracking-widest block mb-2">PRODUCTOS</span>
          <h1 className="text-4xl font-display font-bold">NUESTRO CATÁLOGO.</h1>
        </div>
        <div className="flex gap-2 md:gap-4 flex-wrap md:flex-nowrap mt-4 md:mt-0">
          <select aria-label="Filtrar por categoría" value={cat} onChange={(e) => setCat(e.target.value)} className="field-input w-[180px] bg-px-surface">
            <option value="all">Todas las categorías</option>
            {categorias.map((c) => <option key={c.idCategoria} value={c.idCategoria}>{ETIQUETA[c.nombre] ?? c.nombre}</option>)}
          </select>
          <select aria-label="Ordenar productos" value={orden} onChange={(e) => setOrden(e.target.value)} className="field-input w-[180px] bg-px-surface">
            <option value="none">Ordenar por</option>
            <option value="desc">Precio: Mayor a Menor</option>
            <option value="asc">Precio: Menor a Mayor</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-16" aria-live="polite">
        {lista.map((p) => <ProductCard key={p.idServicio} p={p} />)}
        {lista.length === 0 && <p className="text-px-muted font-body col-span-full">No hay productos en esta categoría por ahora.</p>}
      </div>
    </section>
  );
}
