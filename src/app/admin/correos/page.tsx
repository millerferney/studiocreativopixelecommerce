import type { Metadata } from "next";
import { CorreosAdmin } from "@/components/admin/CorreosAdmin";
import { listarCorreos, PLANTILLAS_DISPONIBLES, vistaPrevia } from "@/server/mail/correos";
import { nombreProveedor, remitente } from "@/server/mail/proveedor";

export const metadata: Metadata = { title: "Correos" };

export default async function Page() {
  const previews: Record<string, string> = {};
  for (const p of PLANTILLAS_DISPONIBLES) {
    previews[p] = vistaPrevia(p) ?? "";
  }

  return (
    <CorreosAdmin
      correos={await listarCorreos()}
      proveedor={nombreProveedor()}
      remitente={remitente()}
      plantillas={PLANTILLAS_DISPONIBLES}
      previews={previews}
    />
  );
}
