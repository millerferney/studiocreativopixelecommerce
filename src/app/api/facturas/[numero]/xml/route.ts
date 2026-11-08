import { requerirUsuario } from "@/lib/auth";
import { api } from "@/lib/http";
import { forbidden } from "@/lib/http";
import { obtenerFacturaPorNumero } from "@/server/services/facturacion";

type Ctx = { params: Promise<{ numero: string }> };
export const GET = api<Ctx>(async (_req, { params }) => {
  const u = await requerirUsuario();
  const f = await obtenerFacturaPorNumero((await params).numero);
  if (f.pedido.idCliente !== u.idUsuario && !u.roles.includes("ADMINISTRADOR")) throw forbidden();
  return new Response(f.xmlUbl, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": `attachment; filename="${f.numeroFactura}.xml"` },
  });
});
