"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { api } from "@/lib/api-client";
import { formatCOP } from "@/lib/money";
import { mensajeError, useAuth, useCart, useToast } from "@/components/providers/AppProviders";
import type { ServicioDTO } from "@/server/dto";

interface Props {
  producto: ServicioDTO;
  colores: { nombre: string; hex: string }[];
  estilos: { id: string; label: string; desc: string; icon: string }[];
}

const ICONOS_MATERIAL: [string, IconName][] = [
  ["Algodón", "shirt"], ["Fleece", "shirt"], ["Poliéster", "shirt"], ["Silicona", "circle"], ["Acrílico", "sparkles"],
  ["Aluminio", "zap"], ["Acero Inox", "shield"], ["Mate", "moon"], ["Chrome", "sun"], ["Brillante", "sun"], ["Esmerilado", "droplets"], ["Glow", "sun"],
];
const iconoMaterial = (m: string): IconName => ICONOS_MATERIAL.find(([k]) => m.includes(k))?.[1] ?? "layers";

export function PersonalizarClient({ producto, colores, estilos }: Props) {
  const router = useRouter();
  const toast = useToast();
  const { agregar } = useCart();
  const { user, abrirAuth } = useAuth();
  const [color, setColor] = useState("#FFFFFF");
  const [colorLibre, setColorLibre] = useState(false);
  const [estilo, setEstilo] = useState<string | null>(null);
  const [talla, setTalla] = useState<string | null>(producto.tallas[0] ?? null);
  const [material, setMaterial] = useState<string | null>(producto.materiales[0] ?? null);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  const [archivo, setArchivo] = useState<{ path: string; nombre: string; tam: number } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animaciones de entrada (.fade-up) como en initScrollAnimations() del prototipo
  useEffect(() => {
    const obs = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }), { threshold: 0.1 });
    document.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const estiloEtiqueta = estilo ? estilos.find((e) => e.id === estilo)?.label : null;
  const total = producto.precio * cantidad;

  async function subir(f: File | undefined) {
    if (!f) return;
    if (!user) { toast("info", "Inicia sesión para adjuntar tu archivo de diseño."); abrirAuth("login"); return; }
    if (!user.roles.includes("CLIENTE")) { toast("error", "Solo las cuentas de cliente pueden adjuntar diseños."); return; }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("archivo", f);
      const r = await api<{ path: string; nombre: string }>("/api/uploads", { formData: fd });
      setArchivo({ path: r.path, nombre: r.nombre, tam: f.size });
      setEstilo((e) => e ?? "custom");
      toast("success", "Archivo adjuntado correctamente");
    } catch (e) {
      toast("error", mensajeError(e, "No se pudo subir el archivo."));
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function alCarrito(irAPagar: boolean) {
    agregar(
      {
        idServicio: producto.idServicio, nombre: producto.nombre, precio: producto.precio, imagenUrl: producto.imagenUrl,
        talla, material, colorHex: color.toUpperCase(), estilo, archivoDiseno: archivo?.path ?? null, archivoNombre: archivo?.nombre ?? null,
        notas: notas.trim() || null, cantidad,
      },
      !irAPagar,
    );
    toast("success", "Producto personalizado añadido al carrito");
    if (irAPagar) setTimeout(() => router.push("/checkout"), 400);
  }

  const Cta = ({ id }: { id?: string }) => (
    <div className="flex flex-col gap-3">
      <button id={id ? `${id}-buy` : undefined} onClick={() => alCarrito(true)} className="neon-cta w-full py-4 rounded-xl font-display font-bold text-sm tracking-widest flex items-center justify-center gap-2 transition-all duration-300">
        <Icon name="zap" className="w-4 h-4" /> COMPRAR AHORA
      </button>
      <button onClick={() => alCarrito(false)} className="btn-cart w-full py-4 rounded-xl font-display font-bold text-sm tracking-widest flex items-center justify-center gap-2">
        <Icon name="shopping-cart" className="w-4 h-4" /> AÑADIR AL CARRITO
      </button>
    </div>
  );

  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-2 text-xs font-mono text-px-faint pt-6 pb-8">
        <Link href="/" className="hover:text-px-cyan transition">Inicio</Link><span>/</span>
        <Link href="/catalogo" className="hover:text-px-cyan transition">Catálogo</Link><span>/</span>
        <span className="text-px-cyan">{producto.nombre}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-[420px] flex-shrink-0 fade-up">
          <div className="product-img-wrap h-[420px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={producto.imagenUrl ?? "/assets/brand/Chartlogo.svg"} alt={producto.nombre} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 mt-4 p-3 bg-px-surface border border-px-purple border-opacity-30 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-px-elevated flex items-center justify-center flex-shrink-0"><Icon name="sparkles" className="w-4 h-4 text-px-purple" /></div>
            <div>
              <p className="font-display font-bold text-xs text-fg m-0">Vista previa de diseño</p>
              <p className="font-mono text-[10px] text-px-faint m-0 uppercase tracking-wide">Las opciones se aplicarán al producto</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="fade-up" style={{ transitionDelay: "0.1s" }}>
            <span className="text-px-cyan font-mono text-[10px] font-bold uppercase tracking-widest block mb-2">PERSONALIZACIÓN PREMIUM</span>
            <h1 className="font-display font-bold text-4xl leading-tight text-fg mb-2">{producto.nombre}</h1>
            <p className="font-mono font-bold text-2xl text-px-green mb-6">{formatCOP(total)}</p>
          </div>

          <div className="summary-panel relative fade-up" style={{ transitionDelay: "0.15s" }}>
            <span className="font-mono text-[11px] text-px-green uppercase tracking-[0.25em] block mb-3">RESUMEN DE PERSONALIZACIÓN</span>
            <div className="flex flex-col gap-3 mb-6">
              <Fila k="Color seleccionado"><div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-fg border-opacity-20" style={{ background: color }} /><span className="font-mono text-fg text-xs">{color.toUpperCase()}</span></div></Fila>
              <Fila k="Diseño"><span className="font-mono text-fg text-xs">{estiloEtiqueta ?? "Sin selección"}</span></Fila>
              <Fila k="Talla"><span className="font-mono text-fg text-xs">{talla ?? "—"}</span></Fila>
              <Fila k="Material"><span className="font-mono text-fg text-xs">{material ?? "—"}</span></Fila>
              <Fila k="Cantidad"><span className="font-mono text-fg text-xs">{cantidad}</span></Fila>
              <div className="flex justify-between text-sm border-t border-fg border-opacity-5 pt-3">
                <span className="text-px-faint font-body">Archivo de referencia</span>
                <span className={`font-mono text-xs truncate max-w-[200px] ${archivo ? "text-px-green" : "text-px-cyan"}`}>{archivo ? archivo.nombre : "No adjunto"}</span>
              </div>
            </div>
            <div className="border-t border-fg border-opacity-5 pt-4 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-[10px] text-px-faint uppercase tracking-widest">Total</span>
                <span className="font-display font-bold text-3xl text-px-cyan">{formatCOP(total)}</span>
              </div>
            </div>
            <Cta />
            <p className="text-center font-mono text-[9px] text-px-faint mt-4 uppercase tracking-widest flex items-center justify-center gap-1">
              <Icon name="shield-check" className="w-3 h-3 text-px-green" />
              Compra 100% segura · Producción en {producto.tiempoEntrega} días hábiles
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 mb-10 border-t border-fg border-opacity-5 pt-14 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="fade-up">
          <span className="step-label">PASO 01</span>
          <h2 className="font-display font-bold text-2xl text-fg mb-1">Elige tu Color</h2>
          <p className="font-body text-sm text-px-faint mb-6">Selecciona uno de los colores predefinidos o usa el selector para un tono personalizado.</p>
          <div className="flex flex-wrap gap-3 mb-6">
            {colores.map((c) => (
              <button key={c.hex} className={`color-swatch ${!colorLibre && color.toUpperCase() === c.hex.toUpperCase() ? "selected" : ""}`} style={{ background: c.hex }} title={c.nombre} aria-label={c.nombre} aria-pressed={color.toUpperCase() === c.hex.toUpperCase()} onClick={() => { setColor(c.hex); setColorLibre(false); }} />
            ))}
          </div>
          <div className="flex items-center gap-4 p-4 bg-px-surface border border-fg border-opacity-5 rounded-xl">
            <div className="relative">
              <input type="color" value={color.length === 7 ? color.toLowerCase() : "#00e5ff"} onChange={(e: ChangeEvent<HTMLInputElement>) => { setColor(e.target.value.toUpperCase()); setColorLibre(true); }} title="Color personalizado" aria-label="Color personalizado" className="rounded-full cursor-pointer" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-fg m-0">Color personalizado</p>
              <p className="font-mono text-xs text-px-faint m-0">{color.toUpperCase()} · {colorLibre ? "Color personalizado" : "Haz clic para cambiar"}</p>
            </div>
          </div>
        </div>

        <div className="fade-up" style={{ transitionDelay: "0.1s" }}>
          <span className="step-label">PASO 02</span>
          <h2 className="font-display font-bold text-2xl text-fg mb-1">Diseño Base</h2>
          <p className="font-body text-sm text-px-faint mb-6">Elige una plantilla de diseño como punto de partida para tu personalización.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {estilos.map((d) => (
              <div key={d.id} role="button" tabIndex={0} aria-pressed={estilo === d.id} className={`design-card ${estilo === d.id ? "selected" : ""}`} onClick={() => setEstilo(d.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEstilo(d.id)}>
                <div className="design-preview">{d.icon}</div>
                <p className="font-display font-bold text-xs text-fg m-0">{d.label}</p>
                <p className="font-mono text-[9px] text-px-faint m-0 mt-1 uppercase">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 pb-12 border-b border-fg border-opacity-5">
        <div className="fade-up">
          <span className="step-label">PASO 03</span>
          <h2 className="font-display font-bold text-2xl text-fg mb-1">Talla</h2>
          <p className="font-body text-sm text-px-faint mb-5">Selecciona la talla o medida de tu producto.</p>
          <div className="flex flex-wrap gap-2">
            {producto.tallas.map((s) => <button key={s} className={`size-pill ${talla === s ? "selected" : ""}`} aria-pressed={talla === s} onClick={() => setTalla(s)}>{s}</button>)}
            {producto.tallas.length === 0 && <span className="text-px-faint text-sm">Talla única</span>}
          </div>
        </div>
        <div className="fade-up" style={{ transitionDelay: "0.1s" }}>
          <span className="step-label">PASO 04</span>
          <h2 className="font-display font-bold text-2xl text-fg mb-1">Material</h2>
          <p className="font-body text-sm text-px-faint mb-5">Elige el acabado o material para tu producto.</p>
          <div className="grid grid-cols-2 gap-3">
            {producto.materiales.map((m) => (
              <button key={m} className={`material-pill ${material === m ? "selected" : ""}`} aria-pressed={material === m} onClick={() => setMaterial(m)}>
                <Icon name={iconoMaterial(m)} className="w-4 h-4" /> {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="fade-up">
          <span className="step-label">PASO 05</span>
          <h2 className="font-display font-bold text-2xl text-fg mb-1">Archivo de Referencia</h2>
          <p className="font-body text-sm text-px-faint mb-6">Sube tu logo, imagen o cualquier archivo que quieras usar como base del diseño (PNG, JPG, SVG, PDF, AI, PSD).</p>
          {!archivo ? (
            <div
              className={`upload-zone ${arrastrando ? "dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files[0]); }}
            >
              <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.psd" aria-label="Subir archivo de diseño" onChange={(e) => subir(e.target.files?.[0])} />
              <div>
                <div className="w-16 h-16 rounded-2xl bg-px-elevated border border-fg border-opacity-5 flex items-center justify-center mx-auto mb-4">
                  <Icon name={subiendo ? "loader-circle" : "upload-cloud"} className={`w-8 h-8 text-px-cyan opacity-60 ${subiendo ? "animate-spin" : ""}`} />
                </div>
                <p className="font-display font-bold text-base text-fg m-0 mb-1">{subiendo ? "Subiendo archivo…" : "Arrastra tu archivo aquí"}</p>
                <p className="font-body text-sm text-px-faint m-0 mb-3">o haz clic para explorar</p>
                <span className="font-mono text-[10px] text-px-faint uppercase tracking-widest">PNG · JPG · SVG · PDF · AI · PSD · Máx 10MB</span>
              </div>
            </div>
          ) : (
            <div className="upload-preview" style={{ display: "flex" }}>
              <div className="w-10 h-10 rounded-lg bg-px-elevated flex items-center justify-center flex-shrink-0"><Icon name="file-check" className="w-5 h-5 text-px-green" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-fg m-0 truncate">{archivo.nombre}</p>
                <p className="font-mono text-[10px] text-px-faint m-0 uppercase">{(archivo.tam / 1024).toFixed(1)} KB</p>
              </div>
              <button aria-label="Quitar archivo" onClick={() => setArchivo(null)} className="w-8 h-8 rounded-lg bg-px-base flex items-center justify-center text-px-faint hover:text-px-pink transition flex-shrink-0"><Icon name="x" className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        <div className="fade-up" style={{ transitionDelay: "0.1s" }}>
          <span className="step-label">PASO 06</span>
          <h2 className="font-display font-bold text-2xl text-fg mb-1">Instrucciones y Cantidad</h2>
          <p className="font-body text-sm text-px-faint mb-5">Describe tu idea, solicita modificaciones o deja indicaciones especiales al equipo de diseño.</p>
          <textarea className="notes-area mb-6" maxLength={500} aria-label="Instrucciones para el equipo de diseño" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder={"Ej: Quiero el logo en la parte superior izquierda con fondo transparente, letras en neon verde...\n\nCuéntanos todo lo que necesitas 🎨"} />
          <div className="p-4 bg-px-surface border border-fg border-opacity-5 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-sm text-fg m-0">Cantidad</p>
              <p className="font-mono text-[10px] text-px-faint m-0 uppercase mt-0.5">Unidades del producto</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="qty-btn" aria-label="Disminuir" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
              <span className="font-display font-bold text-xl text-fg w-8 text-center" aria-live="polite">{cantidad}</span>
              <button className="qty-btn" aria-label="Aumentar" onClick={() => setCantidad((c) => Math.min(10, c + 1))}>+</button>
            </div>
          </div>
          <div className="mt-6"><Cta /></div>
        </div>
      </div>
    </main>
  );
}

function Fila({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="flex justify-between text-sm"><span className="text-px-faint font-body">{k}</span>{children}</div>;
}
