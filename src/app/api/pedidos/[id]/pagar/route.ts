import { requerirUsuario } from "@/lib/auth";
import { api, idParam, leerJson, ok } from "@/lib/http";
import { pagarPedidoSchema } from "@/server/schemas";
import { obtenerPedido, procesarPago } from "@/server/services/pedidos";

type Ctx = { params: Promise<{ id: string }> };
export const POST = api<Ctx>(async (req, { params }) => {
  const u = await requerirUsuario("CLIENTE");
  const id = idParam((await params).id);
  const { pago } = pagarPedidoSchema.parse(await leerJson(req));
  const r = await procesarPago(id, u, pago);
  return ok({ pago: r, pedido: await obtenerPedido(id, u) });
});
