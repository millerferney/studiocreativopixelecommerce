import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReintentarPago } from "@/components/tienda/ReintentarPago";
import { requerirUsuario } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { obtenerPedidoPorNumero } from "@/server/services/pedidos";

export const metadata: Metadata = { title: "Pagar pedido" };
export const dynamic = "force-dynamic";

export default async function PagarPedido({ params }: { params: Promise<{ numero: string }> }) {
  const u = await requerirUsuario("CLIENTE");
  const { numero } = await params;
  let p;
  try { p = await obtenerPedidoPorNumero(numero, u); } catch (e) { if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound(); throw e; }
  if (p.estado !== "PENDIENTE") redirect(`/cuenta/pedidos/${numero}`);
  return (
    <>
      <Link href={`/cuenta/pedidos/${numero}`} className="font-mono text-xs text-px-cyan hover:text-fg inline-block mb-6">← Volver al pedido</Link>
      <h2 className="font-display font-bold text-3xl mb-6">Pagar pedido</h2>
      <ReintentarPago idPedido={p.idPedido} numero={p.numeroPedido} total={p.total} />
    </>
  );
}
