import type { Metadata } from "next";
import { ServiciosAdmin } from "@/components/admin/ServiciosAdmin";
import { listarCategorias, listarServicios } from "@/server/services/catalogo";

export const metadata: Metadata = { title: "Servicios y productos" };
export default async function Page() {
  const [servicios, categorias] = await Promise.all([listarServicios(), listarCategorias()]);
  return <ServiciosAdmin servicios={servicios} categorias={categorias} />;
}
