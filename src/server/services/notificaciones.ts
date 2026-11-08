import "server-only";
import type { Tx } from "@/lib/db";
import { db } from "@/lib/db";

type Tipo = "PEDIDO" | "PAGO" | "FACTURA" | "PRODUCCION" | "SISTEMA";

export async function notificar(
  tx: Tx | typeof db,
  idUsuario: number,
  tipo: Tipo,
  titulo: string,
  mensaje: string,
  idPedido?: number,
) {
  await tx.notificacion.create({ data: { idUsuario, tipo, titulo, mensaje, idPedido: idPedido ?? null } });
}

export async function notificarAdministradores(tx: Tx | typeof db, tipo: Tipo, titulo: string, mensaje: string, idPedido?: number) {
  const admins = await tx.administrador.findMany({ where: { usuario: { estado: "ACTIVO" } }, select: { idUsuario: true } });
  if (admins.length)
    await tx.notificacion.createMany({ data: admins.map((a) => ({ idUsuario: a.idUsuario, tipo, titulo, mensaje, idPedido: idPedido ?? null })) });
}

export async function listarNotificaciones(idUsuario: number, limite = 30) {
  const rows = await db.notificacion.findMany({ where: { idUsuario }, orderBy: { createdAt: "desc" }, take: limite });
  return rows.map((n) => ({
    idNotificacion: n.idNotificacion,
    tipo: n.tipo,
    titulo: n.titulo,
    mensaje: n.mensaje,
    leida: n.leida,
    idPedido: n.idPedido,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function marcarLeidas(idUsuario: number) {
  await db.notificacion.updateMany({ where: { idUsuario, leida: false }, data: { leida: true } });
}
