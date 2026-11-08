import type { Metadata } from "next";
import { CorreosAdmin } from "@/components/admin/CorreosAdmin";
import { listarCorreos, PLANTILLAS_DISPONIBLES } from "@/server/mail/correos";
import { nombreProveedor, remitente } from "@/server/mail/proveedor";

export const metadata: Metadata = { title: "Correos" };

export default async function Page() {
  return <CorreosAdmin correos={await listarCorreos()} proveedor={nombreProveedor()} remitente={remitente()} plantillas={PLANTILLAS_DISPONIBLES} />;
}
