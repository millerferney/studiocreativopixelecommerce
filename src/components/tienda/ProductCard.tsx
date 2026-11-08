"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/AppProviders";
import { Icon } from "@/components/ui/Icon";
import { formatCOP } from "@/lib/money";
import type { ServicioDTO } from "@/server/dto";

/** Tarjeta del catálogo (misma plantilla de renderProducts() del prototipo). */
export function ProductCard({ p }: { p: ServicioDTO }) {
  const { agregar } = useCart();
  return (
    <div className="card bg-px-surface group flex flex-col items-start border border-fg border-opacity-[0.06] hover:border-px-purple hover:border-opacity-30 p-4 rounded-[12px] relative overflow-hidden">
      {p.badge && <div className="absolute top-4 right-4 bg-px-purple text-white px-2 py-0.5 text-[9px] font-mono font-bold z-10 rounded">{p.badge}</div>}
      <div className="w-full bg-px-base border border-fg border-opacity-[0.06] rounded-lg mb-4 h-[160px] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imagenUrl ?? "/assets/brand/Chartlogo.svg"} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
      </div>
      <h3 className="font-display font-bold text-base text-fg group-hover:text-px-purple transition w-full truncate">{p.nombre}</h3>
      <span className="font-mono font-bold text-[13px] text-px-green mb-4">{formatCOP(p.precio)}</span>
      <Link
        href={`/personalizar/${p.idServicio}`}
        className="w-full py-2 mb-2 flex items-center justify-center gap-1.5 bg-transparent border border-px-cyan border-opacity-40 text-px-cyan font-display font-bold text-xs hover:bg-px-cyan hover:text-px-base hover:border-opacity-100 transition tracking-wide text-center rounded-lg"
        style={{ textDecoration: "none" }}
      >
        <Icon name="pencil" className="w-3 h-3" />
        PERSONALIZAR
      </Link>
      <button
        className="w-full py-2 bg-px-elevated border border-fg border-opacity-[0.06] text-px-muted font-display font-bold text-xs hover:bg-px-purple hover:text-white hover:border-px-purple transition tracking-wide text-center rounded-lg"
        onClick={() => agregar({ idServicio: p.idServicio, nombre: p.nombre, precio: p.precio, imagenUrl: p.imagenUrl, talla: null, material: null, colorHex: null, estilo: null, archivoDiseno: null, notas: null })}
      >
        AÑADIR
      </button>
    </div>
  );
}

/** Tarjeta grande de "Productos destacados" de la página Servicios. */
export function FeaturedCard({ p }: { p: ServicioDTO }) {
  const { agregar } = useCart();
  const configurar = !!p.badge; // los productos con insignia (NUEVO/PRO) se muestran con el CTA "Configurar diseño"
  return (
    <div className={`card bg-px-surface group flex flex-col items-start border border-fg border-opacity-[0.06] hover:border-px-purple hover:border-opacity-30 p-5 rounded-[12px] ${configurar ? "relative overflow-hidden" : ""}`}>
      {p.badge && <div className="absolute top-4 right-4 bg-px-green text-onaccent px-2 py-0.5 text-[9px] font-mono font-bold">{p.badge}</div>}
      <div className="w-full bg-px-base border border-fg border-opacity-[0.06] rounded-lg mb-6 h-[200px] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imagenUrl ?? "/assets/brand/Chartlogo.svg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.nombre} loading="lazy" />
      </div>
      <div className="flex items-center justify-between w-full mb-3">
        <h3 className="font-display font-bold text-lg text-fg group-hover:text-px-purple transition uppercase">{p.nombre}</h3>
        <span className="font-mono font-bold text-[13px] text-px-green">{formatCOP(p.precio)}</span>
      </div>
      <p className="font-body text-px-faint text-xs mb-6 leading-relaxed flex-1">{p.descripcion}</p>
      {configurar ? (
        <Link href={`/personalizar/${p.idServicio}`} className="w-full py-3 bg-px-cyan text-onaccent font-display font-bold text-xs hover:bg-opacity-80 transition tracking-wide text-center shadow-[0_0_15px_rgb(var(--c-cyan)/0.2)]">
          CONFIGURAR DISEÑO
        </Link>
      ) : (
        <button
          className="w-full py-3 bg-transparent border border-px-cyan text-px-cyan font-display font-bold text-xs hover:bg-px-cyan hover:bg-opacity-10 transition tracking-wide text-center"
          onClick={() => agregar({ idServicio: p.idServicio, nombre: p.nombre, precio: p.precio, imagenUrl: p.imagenUrl, talla: null, material: null, colorHex: null, estilo: null, archivoDiseno: null, notas: null })}
        >
          AÑADIR AL CARRITO
        </button>
      )}
    </div>
  );
}
