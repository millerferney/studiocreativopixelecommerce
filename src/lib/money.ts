import type { Prisma } from "@/generated/prisma/client";

/** Decimal de Prisma -> number (COP maneja hasta 2 decimales; seguro en el rango de la tienda). */
export const num = (d: Prisma.Decimal | number | string | null | undefined): number =>
  d === null || d === undefined ? 0 : Number(d);

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 });
export const formatCOP = (n: number) => COP.format(n);

export interface Totales {
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
}

/**
 * Misma regla del prototipo web (app.js):
 *   descuento = 5% del subtotal; IVA = 19% sobre (subtotal - descuento); total = subtotal - descuento + IVA.
 * Los porcentajes salen de configuracion_empresa. Redondeo a pesos enteros.
 */
export function calcularTotales(subtotal: number, ivaPct = 19, descPct = 5): Totales {
  const descuento = Math.round((subtotal * descPct) / 100);
  const iva = Math.round(((subtotal - descuento) * ivaPct) / 100);
  return { subtotal, descuento, iva, total: subtotal - descuento + iva };
}

/** Suma N días hábiles (lun–vie). No contempla festivos colombianos. */
export function sumarDiasHabiles(desde: Date, dias: number): Date {
  const d = new Date(desde);
  let restantes = dias;
  while (restantes > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) restantes--;
  }
  return d;
}
