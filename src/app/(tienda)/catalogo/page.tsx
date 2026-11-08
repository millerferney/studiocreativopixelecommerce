import type { Metadata } from "next";
import { CatalogoClient } from "@/components/tienda/CatalogoClient";
import { listarCategorias, listarServicios } from "@/server/services/catalogo";

export const metadata: Metadata = { title: "Catálogo" };
export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  const [productos, categorias] = await Promise.all([listarServicios({ soloDisponibles: true }), listarCategorias()]);
  return (
    <main id="main-content" className="pt-24 pb-20 px-6 max-w-[1200px] mx-auto">
      <CatalogoClient productos={productos} categorias={categorias.filter((c) => c.totalServicios > 0)} />
    </main>
  );
}
