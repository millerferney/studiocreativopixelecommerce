"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { api, ApiClientError } from "@/lib/api-client";
import { formatCOP } from "@/lib/money";
import { claveItem, useAuth, useCart } from "@/components/providers/AppProviders";
import { PAGO_INICIAL, PagoForm, pagoAPayload, type EstadoPago } from "./PagoForm";
import type { PedidoDTO } from "@/server/dto";

const DEPARTAMENTOS = ["Amazonas","Antioquia","Arauca","Atlántico","Bogotá D.C.","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada"];

export interface PerfilCheckout {
  nombreCompleto: string; tipoDocumento: string; numeroDocumento: string; email: string; telefono: string;
  direccion: string; ciudad: string; departamento: string;
}

export function CheckoutClient({ perfil }: { perfil: PerfilCheckout }) {
  const router = useRouter();
  const { items, totales, ivaPct, descPct, vaciar } = useCart();
  const { user, abrirAuth } = useAuth();
  const [envio, setEnvio] = useState<PerfilCheckout>({ ...perfil, tipoDocumento: perfil.tipoDocumento || "CC" });
  const [pago, setPago] = useState<EstadoPago>(PAGO_INICIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [pendiente, setPendiente] = useState<{ idPedido: number; numero: string } | null>(null);

  const set = (k: keyof PerfilCheckout) => (e: { target: { value: string } }) => setEnvio((p) => ({ ...p, [k]: e.target.value }));
  const err = (k: string) => errores[k] && <p role="alert" className="font-mono text-[10px] mt-2" style={{ color: "rgb(var(--c-danger))" }}>{errores[k]}</p>;

  async function pagar(ev: FormEvent) {
    ev.preventDefault();
    if (!user) return abrirAuth("login");
    setProcesando(true); setError(null); setErrores({});
    try {
      type Resp = { pedido: PedidoDTO; pago: { aprobado: boolean; mensaje: string } };
      const r = pendiente
        ? await api<{ pedido: PedidoDTO; pago: Resp["pago"] }>(`/api/pedidos/${pendiente.idPedido}/pagar`, { body: { pago: pagoAPayload(pago) } })
        : await api<Resp>("/api/checkout", {
            body: {
              items: items.map(({ nombre: _n, precio: _p, imagenUrl: _i, archivoNombre: _a, ...x }) => x),
              envio: { ...envio },
              pago: pagoAPayload(pago),
            },
          });
      if (r.pago.aprobado) {
        vaciar();
        router.push(`/checkout/confirmacion/${r.pedido.numeroPedido}`);
        return;
      }
      // Pago rechazado: el pedido queda PENDIENTE y se puede reintentar con otro medio
      setPendiente({ idPedido: r.pedido.idPedido, numero: r.pedido.numeroPedido });
      setError(`${r.pago.mensaje} Tu pedido ${r.pedido.numeroPedido} quedó pendiente: prueba con otro medio de pago.`);
    } catch (e) {
      if (e instanceof ApiClientError) {
        setErrores(e.fieldErrors ?? {});
        setError(e.fieldErrors ? "Revisa los campos marcados en rojo." : e.message);
      } else setError("No se pudo procesar el pago. Inténtalo de nuevo.");
    } finally {
      setProcesando(false);
    }
  }

  if (items.length === 0 && !pendiente) {
    return (
      <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1200px] mx-auto">
        <div className="card bg-px-surface text-center max-w-[520px] mx-auto mt-16 p-10">
          <Icon name="shopping-cart" className="w-10 h-10 text-px-cyan mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">Tu carrito está vacío</h1>
          <p className="font-body text-sm text-px-muted mb-6">Agrega productos desde el catálogo para continuar con el pago.</p>
          <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1200px] mx-auto">
      <div className="mb-14">
        <span className="font-mono text-[10px] font-bold text-px-green uppercase tracking-[0.2em] block mb-3">CHECKOUT TERMINAL V2.4</span>
        <h1 className="font-display font-bold text-5xl md:text-6xl m-0 uppercase tracking-tight flex items-end">Procesar Pago<span className="text-px-cyan leading-[0] ml-1 mb-2.5">.</span></h1>
      </div>

      <form onSubmit={pagar} noValidate className="flex flex-col lg:flex-row gap-16">
        <div className="flex-1">
          <div className="mb-14">
            <div className="flex items-center mb-8 border-b border-fg border-opacity-[0.03] pb-4">
              <span className="step-badge">01</span>
              <h2 className="font-display font-bold text-xl uppercase tracking-widest text-fg m-0">MÉTODO DE PAGO</h2>
            </div>
            <PagoForm valor={pago} onChange={setPago} errores={errores} />
          </div>

          <div>
            <div className="flex items-center mb-8 border-b border-fg border-opacity-[0.03] pb-4">
              <span className="step-badge">02</span>
              <h2 className="font-display font-bold text-xl uppercase tracking-widest text-fg m-0">DETALLES DE FACTURACIÓN Y ENVÍO</h2>
            </div>
            <fieldset disabled={!!pendiente} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 border-0 p-0 m-0">
              <div className="md:col-span-2">
                <label htmlFor="ck-nombre" className="checkout-label">NOMBRE DEL TITULAR</label>
                <input id="ck-nombre" className="checkout-input" autoComplete="name" placeholder="EJ: JUAN PÉREZ" value={envio.nombreCompleto} onChange={set("nombreCompleto")} />
                {err("envio.nombreCompleto")}
              </div>
              <div>
                <label htmlFor="ck-tdoc" className="checkout-label">TIPO DE DOCUMENTO</label>
                <select id="ck-tdoc" className="checkout-input" value={envio.tipoDocumento} onChange={set("tipoDocumento")}>
                  <option value="CC">CÉDULA DE CIUDADANÍA</option><option value="CE">CÉDULA DE EXTRANJERÍA</option>
                  <option value="NIT">NIT</option><option value="PAS">PASAPORTE</option><option value="TI">TARJETA DE IDENTIDAD</option>
                </select>
              </div>
              <div>
                <label htmlFor="ck-doc" className="checkout-label">NÚMERO DE DOCUMENTO</label>
                <input id="ck-doc" className="checkout-input" placeholder="ID / NIT" value={envio.numeroDocumento} onChange={set("numeroDocumento")} />
                {err("envio.numeroDocumento")}
              </div>
              <div>
                <label htmlFor="ck-email" className="checkout-label">CORREO ELECTRÓNICO (A DONDE LLEGA LA FACTURA)</label>
                <input id="ck-email" type="email" className="checkout-input" autoComplete="email" placeholder="USUARIO@EMAIL.COM" value={envio.email} onChange={set("email")} />
                {err("envio.email")}
              </div>
              <div>
                <label htmlFor="ck-tel" className="checkout-label">TELÉFONO</label>
                <input id="ck-tel" type="tel" className="checkout-input" autoComplete="tel" placeholder="3001234567" value={envio.telefono} onChange={set("telefono")} />
                {err("envio.telefono")}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="ck-dir" className="checkout-label">DIRECCIÓN DE ENVÍO</label>
                <input id="ck-dir" className="checkout-input" autoComplete="street-address" placeholder="CALLE / CARRERA, NÚMERO, APTO" value={envio.direccion} onChange={set("direccion")} />
                {err("envio.direccion")}
              </div>
              <div>
                <label htmlFor="ck-ciudad" className="checkout-label">CIUDAD</label>
                <input id="ck-ciudad" className="checkout-input" autoComplete="address-level2" placeholder="BOGOTÁ" value={envio.ciudad} onChange={set("ciudad")} />
                {err("envio.ciudad")}
              </div>
              <div>
                <label htmlFor="ck-depto" className="checkout-label">DEPARTAMENTO</label>
                <input id="ck-depto" className="checkout-input" list="lista-deptos" autoComplete="address-level1" placeholder="CUNDINAMARCA" value={envio.departamento} onChange={set("departamento")} />
                <datalist id="lista-deptos">{DEPARTAMENTOS.map((d) => <option key={d} value={d} />)}</datalist>
                {err("envio.departamento")}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="w-full lg:w-[480px]">
          <div className="bg-px-surface border-l-4 border-px-green p-10 relative">
            <h2 className="font-display font-bold text-2xl uppercase text-fg m-0 mb-10 tracking-widest">RESUMEN DEL PEDIDO</h2>
            <div className="flex flex-col gap-6 mb-12">
              {pendiente && <p className="font-mono text-[11px] text-px-green uppercase tracking-widest">Pedido {pendiente.numero} · pendiente de pago</p>}
              {items.map((it) => (
                <div key={claveItem(it)} className="flex gap-4 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.imagenUrl ?? "/assets/brand/Chartlogo.svg"} alt="" className="w-14 h-14 rounded-lg object-cover bg-px-base border border-fg border-opacity-[0.06]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-fg m-0 truncate">{it.nombre}</p>
                    <p className="font-mono text-[10px] text-px-faint m-0 uppercase">{[it.talla, it.material].filter(Boolean).join(" · ")} × {it.cantidad}</p>
                  </div>
                  <span className="font-mono text-xs text-fg">{formatCOP(it.precio * it.cantidad)}</span>
                </div>
              ))}
            </div>
            <Linea k="SUBTOTAL" v={formatCOP(totales.subtotal)} />
            <Linea k={`IVA (${ivaPct}%)`} v={formatCOP(totales.iva)} />
            <Linea k={`DESCUENTO PIXEL (${descPct}%)`} v={`-${formatCOP(totales.descuento)}`} verde />
            <div className="border-t border-fg border-opacity-[0.05] pt-8 mb-8 pb-8 border-b">
              <span className="checkout-label">TOTAL A PAGAR</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-5xl text-fg tracking-tight">{formatCOP(totales.total)}</span>
                <span className="font-mono text-xs text-px-muted">COP</span>
              </div>
            </div>

            {error && <div role="alert" className="mb-6 p-4 font-body text-sm" style={{ border: "1px solid rgb(var(--c-danger) / 0.4)", background: "rgb(var(--c-danger) / 0.08)", color: "rgb(var(--c-dsoft))" }}>{error}</div>}

            {user ? (
              <button type="submit" disabled={procesando} className="w-full bg-px-green text-onaccent font-display font-bold text-lg py-5 flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 hover:shadow-[0_0_35px_rgb(var(--c-green)/0.5)] disabled:opacity-60 disabled:hover:translate-y-0">
                {procesando ? <>PROCESANDO… <Icon name="loader-circle" className="w-5 h-5 animate-spin" /></> : <>{pendiente ? "REINTENTAR PAGO" : "PAGAR AHORA"} <Icon name="arrow-right" className="w-5 h-5" /></>}
              </button>
            ) : (
              <button type="button" onClick={() => abrirAuth("login")} className="w-full bg-px-green text-onaccent font-display font-bold text-lg py-5">INICIA SESIÓN PARA PAGAR</button>
            )}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Icon name="shield-check" className="w-3 h-3 text-px-green" />
              <span className="font-mono text-[9px] text-px-faint tracking-widest uppercase">CONEXIÓN SEGURA TLS · DATOS DE TARJETA NO ALMACENADOS</span>
            </div>
          </div>

          <div className="mt-8 bg-px-base border border-fg border-opacity-[0.03] p-6 flex gap-6 items-center overflow-hidden relative group">
            <div className="absolute -right-4 -bottom-4 text-px-elevated opacity-50 group-hover:scale-110 transition-transform"><Icon name="zap" className="w-24 h-24" /></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/logo_bg_black.svg" className="only-dark w-16 h-16 opacity-30 object-contain mix-blend-screen bg-px-elevated rounded-lg p-2" alt="Soporte" />
            <img src="/assets/brand/logo_white.svg" className="only-light w-16 h-16 object-contain bg-px-elevated rounded-lg p-2" alt="Soporte" />
            <div className="relative z-10">
              <h4 className="font-display font-bold text-[11px] text-px-green uppercase tracking-widest m-0 mb-1">SOPORTE PRIORITY</h4>
              <p className="font-mono text-[9px] text-px-faint uppercase tracking-widest m-0 leading-relaxed">CHAT 24/7 DISPONIBLE PARA ESTE PEDIDO</p>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

function Linea({ k, v, verde }: { k: string; v: string; verde?: boolean }) {
  return (
    <div className={`flex justify-between font-mono text-[11px] mb-4 tracking-widest uppercase ${verde ? "font-bold text-px-green" : "text-px-muted"}`}>
      <span>{k}</span><span>{v}</span>
    </div>
  );
}
