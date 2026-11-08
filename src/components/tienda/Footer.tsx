import Link from "next/link";

export function Footer() {
  return (
    <footer className="tienda-footer border-t border-fg border-opacity-[0.05] pt-14 pb-8 px-6 bg-px-base transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        {/* Logo col */}
        <div className="flex flex-col items-start gap-5">
          <Link href="/" className="no-underline">
            <img
              src="/assets/brand/Chartlogo.svg"
              alt="Logo Studio Pixel"
              className="only-dark h-24 w-24 rounded-3xl shadow-[0_0_30px_rgb(var(--c-cyan)/0.15)]"
            />
            <img
              src="/assets/brand/logo_white.svg"
              alt="Logo Studio Pixel"
              className="only-light h-24 w-24 object-contain rounded-3xl border border-white/20 bg-white/95 p-1.5 shadow-md"
            />
          </Link>
          <p className="font-body text-xs text-px-faint footer-text max-w-[250px] leading-relaxed transition-colors">
            Plataforma de sublimación, diseño y producción premium. Llevamos tu identidad visual a soportes físicos con
            precisión extrema.
          </p>
        </div>

        {/* Explorar */}
        <div>
          <h4 className="font-display font-bold text-sm text-fg mb-5">Explorar</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/" className="font-body text-sm text-px-faint footer-nav-link hover:text-px-green transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link href="/servicios" className="font-body text-sm text-px-faint footer-nav-link hover:text-px-green transition-colors">
                Servicios
              </Link>
            </li>
            <li>
              <Link href="/catalogo" className="font-body text-sm text-px-faint footer-nav-link hover:text-px-green transition-colors">
                Catálogo
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-display font-bold text-sm text-fg mb-5">Legal</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <a href="#" className="font-body text-sm text-px-faint footer-nav-link hover:text-px-green transition-colors">
                Términos y condiciones
              </a>
            </li>
            <li>
              <a href="#" className="font-body text-sm text-px-faint footer-nav-link hover:text-px-green transition-colors">
                Política de privacidad
              </a>
            </li>
            <li>
              <a href="#" className="font-body text-sm text-px-faint footer-nav-link hover:text-px-green transition-colors">
                Política de envíos
              </a>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-display font-bold text-sm text-fg mb-5">Social</h4>
          <div className="flex items-center gap-3.5">
            {/* Instagram SVG */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="group w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-pink-600/30 text-white hover:text-pink-300 border border-white/20 hover:border-pink-400/60 shadow-sm hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-all duration-300 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            {/* Facebook SVG */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="group w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-blue-600/30 text-white hover:text-sky-300 border border-white/20 hover:border-sky-400/60 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-300 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* X (Twitter) SVG: blanco sin hover, tono morado en hover */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="group w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-purple-600/30 text-white hover:text-purple-300 border border-white/20 hover:border-purple-400/60 shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] transition-all duration-300 backdrop-blur-sm"
            >
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto border-t border-fg border-opacity-[0.05] footer-divider pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-mono text-[11px] text-px-faint footer-copyright m-0">
          © 2026 Studio Creativo Pixel. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
