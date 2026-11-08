import type { Metadata } from "next";
import { CategoriasAdmin } from "@/components/admin/CategoriasAdmin";
import { listarCategorias } from "@/server/services/catalogo";

export const metadata: Metadata = { title: "Categorías" };
export default async function Page() { return <CategoriasAdmin categorias={await listarCategorias()} />; }
