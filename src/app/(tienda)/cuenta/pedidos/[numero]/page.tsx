import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PedidoResumen } from "@/components/tienda/PedidoResumen";
import { CancelarPedido } from "@/components/tienda/CancelarPedido";
import { requerirUsuario } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { obtenerPedidoPorNumero } from "@/server/services/pedidos";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  return { title: `Pedido ${(await params).numero}` };
}

export default async function DetallePedido({ params }: { params: Promise<{ numero: string }> }) {
  const u = await requerirUsuario("CLIENTE");
  const { numero } = await params;
  let p;
  try { p = await obtenerPedidoPorNumero(numero, u); } catch (e) { if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound(); throw e; }
  return (
    <>
      <Link href="/cuenta/pedidos" className="font-mono text-xs text-px-cyan hover:text-fg inline-block mb-6">← Volver a mis pedidos</Link>
      {p.estado === "PENDIENTE" && (
        <div className="card bg-px-surface mb-8 flex flex-wrap gap-4 items-center justify-between" style={{ borderColor: "rgb(var(--c-purple) / 0.5)" }}>
          <p className="font-body text-sm text-px-muted m-0">Este pedido está pendiente de pago.</p>
          <div className="flex gap-3">
            <Link href={`/cuenta/pedidos/${p.numeroPedido}/pagar`} className="btn-success">Pagar ahora</Link>
            <CancelarPedido idPedido={p.idPedido} />
          </div>
        </div>
      )}
      <PedidoResumen p={p} />
    </>
  );
}
