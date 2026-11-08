import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PedidoAcciones } from "@/components/admin/PedidoAcciones";
import { PedidoResumen } from "@/components/tienda/PedidoResumen";
import { requerirUsuario } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { obtenerPedidoPorNumero } from "@/server/services/pedidos";
import { urlFirmada } from "@/server/storage/supabase";

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  return { title: `Pedido ${(await params).numero}` };
}

export default async function Page({ params }: { params: Promise<{ numero: string }> }) {
  const admin = await requerirUsuario("ADMINISTRADOR");
  const { numero } = await params;
  let p;
  try { p = await obtenerPedidoPorNumero(numero, admin); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  // Enlaces firmados (10 min) a los archivos de diseño que subió el cliente
  const archivos = await Promise.all(
    p.items.filter((i) => i.archivoDiseno).map(async (i) => ({ nombre: i.archivoDiseno!.split("/").pop()!.replace(/^[0-9a-f-]{36}-/, ""), url: await urlFirmada(i.archivoDiseno!) })),
  );
  return (
    <section>
      <Link href="/admin/pedidos" className="font-mono text-xs text-px-cyan hover:text-fg inline-block mb-6">← Volver a pedidos</Link>
      <PedidoAcciones idPedido={p.idPedido} estado={p.estado} tienePagoAprobado={p.pagos.some((g) => g.estado === "APROBADO")} tieneFactura={!!p.factura} />
      {archivos.length > 0 && (
        <div className="adm-card mb-8">
          <h2 className="font-display text-lg font-bold mb-3">Archivos de diseño del cliente</h2>
          <ul className="list-none p-0 m-0 flex flex-col gap-2 font-body text-sm">
            {archivos.map((a, i) => <li key={i}>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-px-cyan hover:text-fg">{a.nombre}</a> : <span className="text-px-muted">{a.nombre} (enlace no disponible)</span>}</li>)}
          </ul>
        </div>
      )}
      <PedidoResumen p={p} admin />
    </section>
  );
}
