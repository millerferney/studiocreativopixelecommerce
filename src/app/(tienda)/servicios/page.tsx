import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { FeaturedCard } from "@/components/tienda/ProductCard";
import { listarServicios } from "@/server/services/catalogo";

export const metadata: Metadata = { title: "Servicios" };
export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  const destacados = (await listarServicios({ soloDisponibles: true, destacados: true })).slice(0, 3);
  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1200px] mx-auto">


    {/* Hero Servicios */}
    <section className="flex flex-col md:flex-row items-center gap-12 mb-24">
      <div className="flex-1">
        <span className="inline-block bg-px-cyan text-onaccent px-3 py-1 font-bold font-mono text-[10px] tracking-wide mb-6">SUBLIMACIÓN
          PREMIUM</span>
        <h1 className="text-4xl md:text-6xl font-display font-bold leading-none mb-6">
          <span className="text-px-green">SUBLIMACIÓN</span><br />
          SIN LÍMITES
        </h1>
        <p className="text-px-muted font-body text-lg border-l-2 border-px-cyan pl-4 py-2 border-opacity-50">
          Llevamos tu identidad visual a soportes físicos con precisión extrema. Tazas, hoodies y carcasas con colores
          vibrantes que no pierden intensidad.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/catalogo" className="btn-success text-onaccent border-none">PERSONALIZAR AHORA</Link>
          <Link href="/catalogo" className="font-display font-bold text-sm text-px-cyan flex items-center gap-2 hover:text-fg transition">
            VER CATÁLOGO <Icon name="arrow-right" className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="flex-1 flex justify-center">
        {/* Replicating the cool boxed glowing image */}
        <div className="card p-6 border-px-cyan border-opacity-20 relative bg-px-surface">
          <div className="absolute inset-0 bg-px-green opacity-[0.05] rounded-xl blur-xl animate-pulse"></div>
          <img src="/assets/brand/LOGO1-FONDO.svg" className="only-dark w-[280px] h-[280px] object-contain relative z-10 drop-shadow-[0_0_20px_rgb(var(--c-cyan)/0.4)]" alt="Abstract" />
          <img src="/assets/brand/logo_white.svg" className="only-light w-[280px] h-[280px] object-contain relative z-10" alt="Abstract" />
        </div>
      </div>
    </section>

    
    {/* Productos Destacados */}
    <section className="mb-24">
      <span className="text-px-green font-mono text-xs font-bold uppercase tracking-widest block mb-2">LO MÁS TOP</span>
      <h2 className="text-4xl font-display font-bold mb-10">PRODUCTOS<br />DESTACADOS.</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {destacados.map((p) => <FeaturedCard key={p.idServicio} p={p} />)}
      </div>
    </section>

    {/* Capacidades Técnicas */}
    <section className="mb-24 pt-12 border-t border-fg border-opacity-[0.06]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="text-px-cyan font-mono text-xs font-bold uppercase tracking-widest block mb-2">ESPECIALIDADES</span>
          <h2 className="text-4xl font-display font-bold">CAPACIDADES<br />TÉCNICAS.</h2>
        </div>
        <p className="text-px-faint font-body text-sm text-right max-w-sm mt-6 md:mt-0">
          Nuestra tecnología de impresión garantiza una fidelidad cromática del 99.9% sobre resinas y superficies
          sólidas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        <div className="bg-px-surface p-8 h-full">
          <Icon name="printer" className="w-8 h-8 text-px-green mb-6" />
          <h3 className="font-display font-bold text-lg text-fg mb-4">IMPRESIÓN HD</h3>
          <p className="font-body text-xs text-px-faint mb-8 leading-relaxed">Resolución milimétrica en cada fibra.
            Utilizamos tintas premium de secado ultra rápido para evitar distorsiones en los bordes.</p>
          <div className="flex gap-4 font-mono font-bold text-[9px] uppercase text-px-text">
            <span>PANTONE MATCH</span><span className="border-l border-fg border-opacity-10 pl-4">UV PROOF</span>
          </div>
        </div>
        <div className="bg-px-surface p-8 h-full bg-opacity-80">
          <Icon name="shield-check" className="w-8 h-8 text-px-cyan mb-6" />
          <h3 className="font-display font-bold text-lg text-fg mb-4">CALIDAD INDUSTRIAL</h3>
          <p className="font-body text-xs text-px-faint mb-8 leading-relaxed">Prensado térmico controlado por IA para
            asegurar una transferencia perfecta sin quemaduras ni zonas pálidas.</p>
          <div className="flex gap-4 font-mono font-bold text-[9px] uppercase text-px-text">
            <span>DURABILITY+</span><span className="border-l border-fg border-opacity-10 pl-4">QC APROBADO</span>
          </div>
        </div>
        <div className="bg-px-base border border-px-surface p-8 h-full">
          <Icon name="palette" className="w-8 h-8 text-px-green mb-6" />
          <h3 className="font-display font-bold text-lg text-fg mb-4">DISEÑO PRO</h3>
          <p className="font-body text-xs text-px-faint mb-8 leading-relaxed">No solo imprimimos, optimizamos tus archivos
            para que el resultado final supere tus expectativas visuales.</p>
          <div className="flex gap-4 font-mono font-bold text-[9px] uppercase text-px-text">
            <span>VECTORES</span><span className="border-l border-fg border-opacity-10 pl-4">COLOR GRADING</span>
          </div>
        </div>
      </div>
    </section>

  

    </main>
  );
}
