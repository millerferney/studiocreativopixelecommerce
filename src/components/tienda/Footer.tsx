import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-fg border-opacity-[0.05] pt-14 pb-8 px-6 bg-px-base">
    <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
      {/* Logo col */}
      <div className="flex flex-col items-start gap-5">
        <Link href="/" className="no-underline">
          <img src="/assets/brand/Chartlogo.svg" alt="Logo Studio Pixel" className="only-dark h-24 w-24 rounded-3xl shadow-[0_0_30px_rgb(var(--c-cyan)/0.15)]" />
          <img src="/assets/brand/logo_white.svg" alt="Logo Studio Pixel" className="only-light h-24 w-24 object-contain rounded-3xl border border-fg border-opacity-10 bg-white p-1.5" />
        </Link>
        <p className="font-body text-xs text-px-faint max-w-[250px] leading-relaxed footer-link transition-colors">
          Plataforma de sublimación, diseño y producción premium. Llevamos tu identidad visual a soportes físicos con
          precisión extrema.
        </p>
      </div>

      {/* Explorar */}
      <div>
        <h4 className="font-display font-bold text-sm text-fg mb-5">Explorar</h4>
        <ul className="flex flex-col gap-3">
          <li><Link href="/" className="font-body text-sm text-px-faint hover:text-px-green transition-colors">Inicio</Link></li>
          <li><Link href="/servicios" className="font-body text-sm text-px-faint hover:text-px-green transition-colors">Servicios</Link></li>
          <li><Link href="/catalogo" className="font-body text-sm text-px-faint hover:text-px-green transition-colors">Catálogo</Link></li>
        </ul>
      </div>

      {/* Legal */}
      <div>
        <h4 className="font-display font-bold text-sm text-fg mb-5">Legal</h4>
        <ul className="flex flex-col gap-3">
          <li><a href="#" className="font-body text-sm text-px-faint hover:text-px-green transition-colors">Términos y
              condiciones</a></li>
          <li><a href="#" className="font-body text-sm text-px-faint hover:text-px-green transition-colors">Política de
              privacidad</a></li>
          <li><a href="#" className="font-body text-sm text-px-faint hover:text-px-green transition-colors">Política de
              envíos</a></li>
        </ul>
      </div>

      {/* Social */}
      <div>
        <h4 className="font-display font-bold text-sm text-fg mb-5">Social</h4>
        <div className="flex items-center gap-5">
          <a href="#" className="footer-icon-wrap" aria-label="Instagram">
            <img src="/assets/brand/Instagram_Glyph_White.svg" className="invert-light w-6 h-6" alt="Instagram" />
          </a>
          <a href="#" className="footer-icon-wrap" aria-label="Facebook">
            <img src="/assets/brand/Facebook_Logo_Secondary.png" className="w-6 h-6 object-contain" alt="Facebook" />
          </a>
          <a href="#" className="footer-icon-wrap" aria-label="X (Twitter)">
            <img src="/assets/brand/logo-white.png" className="invert-light w-6 h-6 object-contain" alt="X" />
          </a>
        </div>
      </div>
    </div>

    <div className="max-w-[1200px] mx-auto border-t border-fg border-opacity-[0.05] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="font-mono text-[11px] text-px-faint m-0">© 2026 Studio Creativo Pixel. Todos los derechos reservados.
      </p>
    </div>
  </footer>
  );
}
