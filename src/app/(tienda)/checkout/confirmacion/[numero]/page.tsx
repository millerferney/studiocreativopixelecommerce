import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PedidoResumen } from "@/components/tienda/PedidoResumen";
import { usuarioActual } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { obtenerPedidoPorNumero } from "@/server/services/pedidos";

export const metadata: Metadata = { title: "Pedido confirmado" };
export const dynamic = "force-dynamic";

export default async function Confirmacion({ params }: { params: Promise<{ numero: string }> }) {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  const { numero } = await params;
  let p;
  try { p = await obtenerPedidoPorNumero(numero, u); } catch (e) { if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound(); throw e; }
  const pagado = p.estado !== "PENDIENTE" && p.estado !== "CANCELADO";
  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1000px] mx-auto">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: pagado ? "rgb(var(--c-green) / 0.12)" : "rgb(var(--c-danger) / 0.12)", border: `1px solid ${pagado ? "rgb(var(--c-green))" : "rgb(var(--c-danger))"}` }}>
          <Icon name={pagado ? "circle-check" : "triangle-alert"} className={`w-8 h-8 ${pagado ? "text-px-green" : "text-px-danger"}`} />
        </div>
        <span className="font-mono text-[10px] font-bold text-px-green uppercase tracking-[0.2em] block mb-2">{pagado ? "PAGO APROBADO" : "PAGO PENDIENTE"}</span>
        <h1 className="font-display font-bold text-4xl md:text-5xl m-0 uppercase">{pagado ? "¡Gracias por tu compra!" : "Pedido recibido"}</h1>
        <p className="font-body text-px-muted mt-3">
          {pagado
            ? p.factura ? `Emitimos la factura electrónica ${p.factura.numeroFactura} y la enviamos a ${p.envio.email}.` : "Tu pago fue aprobado. Estamos generando tu factura electrónica; aparecerá en tu cuenta en unos instantes."
            : "Aún no recibimos el pago de este pedido."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link href="/cuenta/pedidos" className="btn-primary">Mis pedidos</Link>
          {p.factura && <Link href={`/factura/${p.factura.numeroFactura}`} className="btn-secondary">Ver factura</Link>}
          <Link href="/catalogo" className="btn-secondary">Seguir comprando</Link>
        </div>
      </div>
      <PedidoResumen p={p} />
    </main>
  );
}
