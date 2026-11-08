import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonalizarClient } from "@/components/tienda/PersonalizarClient";
import { listarColores, listarEstilos, obtenerServicio } from "@/server/services/catalogo";
import { ApiError } from "@/lib/http";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

async function cargar(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  try {
    const p = await obtenerServicio(n);
    return p.estado === "DISPONIBLE" ? p : null;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await cargar((await params).id);
  return { title: p ? `Personalizar ${p.nombre}` : "Producto no encontrado" };
}

export default async function PersonalizarPage({ params }: Props) {
  const p = await cargar((await params).id);
  if (!p) notFound();
  const [colores, estilos] = await Promise.all([listarColores(), listarEstilos()]);
  return <PersonalizarClient producto={p} colores={colores} estilos={estilos} />;
}
