import { requerirUsuario } from "@/lib/auth";
import { api, idParam, ok } from "@/lib/http";
import { db } from "@/lib/db";
import { correoFacturaEmitida } from "@/server/mail/correos";
import { emitirFactura } from "@/server/services/facturacion";

type Ctx = { params: Promise<{ id: string }> };
// Reintento manual de emisión (p. ej. si el proveedor falló justo después del pago aprobado). Idempotente.
export const POST = api<Ctx>(async (_req, { params }) => {
  await requerirUsuario("ADMINISTRADOR");
  const id = idParam((await params).id);
  const yaExistia = await db.factura.findUnique({ where: { idPedido: id }, select: { idFactura: true } });
  const f = await emitirFactura(id);
  if (!yaExistia) correoFacturaEmitida(id);
  return ok({ idFactura: f.idFactura, numeroFactura: f.numeroFactura }, 201);
});
