import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AuthButton } from "@/components/tienda/AuthButton";

export default function Inicio() {
  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1200px] mx-auto">
<section className="mt-6 mb-20 flex flex-col md:flex-row items-center gap-12">

      {/* Copy izquierda */}
      <div className="flex-1">
        <span className="inline-block font-mono text-[10px] font-bold text-px-green tracking-widest uppercase mb-5
                     bg-px-elevated border border-fg border-opacity-[0.06] px-3 py-1 rounded-full">
          Plataforma activa · 2026
        </span>

        <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.0] mb-6 text-fg">
          LA<br />
          <span style={{ color: 'rgb(var(--c-green))' }}>EVOLUCIÓN</span><br />
          DIGITAL.
        </h1>

        <p className="text-px-muted font-body text-base md:text-lg mb-8 max-w-[420px] leading-relaxed border-l-2 border-px-cyan border-opacity-40 pl-4">
          Llevamos tu identidad visual a soportes físicos con precisión extrema. Sublimación, branding y producción
          premium.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/catalogo" className="btn-primary py-3 px-6 text-sm tracking-wide flex items-center gap-2 shadow-[0_0_20px_rgb(var(--c-cyan)/0.2)]">
            <Icon name="package" className="w-4 h-4" />
            Ver catálogo
          </Link>
          <AuthButton tab="register" className="btn-secondary py-3 px-6 text-sm tracking-wide flex items-center gap-2">
            <Icon name="user-plus" className="w-4 h-4" />
            Registrarse
          </AuthButton>
        </div>

        {/* Métricas */}
        <div className="flex gap-6 mt-12">
          <div>
            <span className="font-display font-bold text-3xl text-px-cyan block">500+</span>
            <span className="font-mono text-[10px] text-px-faint uppercase tracking-wider">Proyectos</span>
          </div>
          <div className="border-l border-fg border-opacity-10 pl-6">
            <span className="font-display font-bold text-3xl text-fg block">99%</span>
            <span className="font-mono text-[10px] text-px-faint uppercase tracking-wider">Satisfacción</span>
          </div>
          <div className="border-l border-fg border-opacity-10 pl-6">
            <span className="font-display font-bold text-3xl text-px-green block">24h</span>
            <span className="font-mono text-[10px] text-px-faint uppercase tracking-wider">Entrega</span>
          </div>
        </div>
      </div>

      {/* Panel visual derecha */}
      <div className="flex-1 relative flex justify-center items-center min-h-[420px]">
        {/* Orbes de glow animados */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: '0' }}>
          <div className="hero-glow-1"></div>
          <div className="hero-glow-2"></div>
        </div>

        {/* Logo SVG de fondo */}
        <img src="/assets/brand/LOGO1-FONDO.svg" alt="" className="only-dark absolute w-full max-w-[440px] pointer-events-none select-none" style={{ opacity: '0.25', zIndex: '0' }} />
        <img src="/assets/brand/logo_white.svg" alt="" className="only-light absolute w-full max-w-[440px] pointer-events-none select-none" style={{ opacity: '0.55', zIndex: '0' }} />

        {/* Tarjeta principal */}
        <div className="relative flex flex-col gap-4 w-full max-w-[360px]" style={{ zIndex: '1' }}>

          {/* Branding card */}
          <div className="flex items-center gap-4 bg-px-surface border border-fg border-opacity-[0.06] rounded-2xl p-5" style={{ boxShadow: '0 0 40px rgb(var(--c-cyan) / 0.04)' }}>
            <img src="/assets/brand/Chartlogo.svg" className="only-dark w-12 h-12 rounded-xl shrink-0" alt="Logo" />
            <img src="/assets/brand/logo_white.svg" className="only-light w-12 h-12 object-contain shrink-0" alt="Logo" />
            <div>
              <p className="font-display font-bold text-fg text-sm mb-0.5">Studio Creativo Pixel</p>
              <p className="font-body text-xs text-px-muted">Sublimación · Diseño · Producción</p>
              <span className="inline-flex items-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 bg-px-green rounded-full animate-pulse"></span>
                <span className="font-mono text-[10px] text-px-green">PLATAFORMA ACTIVA</span>
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-px-surface border border-fg border-opacity-[0.06] rounded-xl p-4 text-center">
              <span className="font-display font-bold text-xl text-px-cyan block">500+</span>
              <span className="font-mono text-[9px] text-px-faint uppercase">Pedidos</span>
            </div>
            <div className="bg-px-surface border border-fg border-opacity-[0.06] rounded-xl p-4 text-center">
              <span className="font-display font-bold text-xl text-fg block">99%</span>
              <span className="font-mono text-[9px] text-px-faint uppercase">Satisf.</span>
            </div>
            <div className="bg-px-surface border border-fg border-opacity-[0.06] rounded-xl p-4 text-center">
              <span className="font-display font-bold text-xl text-px-green block">24h</span>
              <span className="font-mono text-[9px] text-px-faint uppercase">Entrega</span>
            </div>
          </div>

        </div>
      </div>

    </section>{/* /HERO */}

    {/* SERVICIOS destacados (mini preview) */}
    <section className="border-t border-fg border-opacity-[0.06] pt-16 mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
        <div>
          <span className="font-mono text-[10px] font-bold text-px-cyan uppercase tracking-widest block mb-2">ESPECIALIDADES</span>
          <h2 className="font-display font-bold text-3xl text-fg m-0">LO QUE HACEMOS MEJOR.</h2>
        </div>
        <Link href="/servicios" className="mt-4 md:mt-0 font-body text-sm text-px-cyan hover:text-fg flex items-center gap-1.5 transition-colors">
          Ver todos los servicios <Icon name="arrow-right" className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-fg bg-opacity-[0.05] rounded-xl overflow-hidden border border-fg border-opacity-[0.04]">
        <div className="bg-px-base p-8">
          <Icon name="printer" className="w-7 h-7 text-px-green mb-5" />
          <h3 className="font-display font-bold text-base text-fg mb-2">Impresión HD</h3>
          <p className="font-body text-xs text-px-faint leading-relaxed">Resolución milimétrica en cada fibra con tintas
            premium de secado ultra rápido.</p>
        </div>
        <div className="bg-px-base p-8">
          <Icon name="shirt" className="w-7 h-7 text-px-cyan mb-5" />
          <h3 className="font-display font-bold text-base text-fg mb-2">Textiles Premium</h3>
          <p className="font-body text-xs text-px-faint leading-relaxed">Hoodies, gorras y prendas con sublimación de alta
            definición que no pierde color.</p>
        </div>
        <div className="bg-px-base p-8">
          <Icon name="palette" className="w-7 h-7 text-px-purple mb-5" />
          <h3 className="font-display font-bold text-base text-fg mb-2">Diseño Creativo</h3>
          <p className="font-body text-xs text-px-faint leading-relaxed">Optimizamos tus archivos para que el resultado
            final supere tus expectativas.</p>
        </div>
      </div>
    </section>
    </main>
  );
}
