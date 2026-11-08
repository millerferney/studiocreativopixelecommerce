import type { Metadata } from "next";
import { CheckoutClient } from "@/components/tienda/CheckoutClient";
import { usuarioActual } from "@/lib/auth";
import { perfilCliente } from "@/server/services/usuarios";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const u = await usuarioActual();
  const p = u?.roles.includes("CLIENTE") ? await perfilCliente(u.idUsuario) : null;
  return (
    <CheckoutClient
      perfil={{
        nombreCompleto: p ? `${p.nombre} ${p.apellido ?? ""}`.trim() : "",
        tipoDocumento: p?.tipoDocumento ?? "CC",
        numeroDocumento: p?.numeroDocumento ?? "",
        email: p?.email ?? "",
        telefono: p?.telefono ?? "",
        direccion: p?.direccion ?? "",
        ciudad: p?.ciudad ?? "",
        departamento: p?.departamento ?? "",
      }}
    />
  );
}
