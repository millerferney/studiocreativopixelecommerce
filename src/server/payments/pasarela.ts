import "server-only";
import { randomUUID } from "node:crypto";

/**
 * Pasarela de pago SIMULADA. En producción se reemplaza por Wompi / PayU / Mercado Pago / Stripe
 * implementando la misma interfaz `Pasarela` (ver README). Regla PCI-DSS: el número de tarjeta y el CVV
 * solo viajan en memoria hacia la pasarela; NUNCA se guardan ni se escriben en logs.
 */
export interface EntradaCobro {
  metodo: "TARJETA" | "PSE";
  monto: number;
  referencia: string;
  tarjeta?: { numero: string; expiracion: string; cvv: string };
  pse?: { banco: string; tipoPersona: "NATURAL" | "JURIDICA" };
}
export interface ResultadoCobro {
  aprobado: boolean;
  codigo: string;
  mensaje: string;
  referenciaPasarela: string;
  marcaTarjeta?: string;
  ultimos4?: string;
  banco?: string;
}
export interface Pasarela {
  cobrar(e: EntradaCobro): Promise<ResultadoCobro>;
}

export const BANCOS_PSE = [
  "Bancolombia",
  "Banco de Bogotá",
  "Davivienda",
  "BBVA Colombia",
  "Banco de Occidente",
  "Nequi",
  "Banco Pruebas (rechaza)",
] as const;

export function luhn(numero: string): boolean {
  let suma = 0;
  let alterna = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = Number(numero[i]);
    if (alterna) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    alterna = !alterna;
  }
  return suma % 10 === 0;
}

export function marcaTarjeta(n: string): string {
  if (/^4/.test(n)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "MASTERCARD";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^(36|38|30[0-5])/.test(n)) return "DINERS";
  return "TARJETA";
}

function vencida(exp: string): boolean {
  const [mm, yy] = exp.split("/").map((x) => Number(x.trim()));
  const fin = new Date(2000 + yy, mm, 0, 23, 59, 59); // último día del mes de expiración
  return fin.getTime() < Date.now();
}

// Tarjetas de prueba (documentadas en el README)
const RECHAZOS: Record<string, { codigo: string; mensaje: string }> = {
  "4000000000000002": { codigo: "DECLINED", mensaje: "Tarjeta rechazada por el banco emisor." },
  "4000000000009995": { codigo: "INSUFFICIENT_FUNDS", mensaje: "Fondos insuficientes." },
  "4000000000000069": { codigo: "EXPIRED_CARD", mensaje: "Tarjeta vencida." },
};

export const pasarelaSimulada: Pasarela = {
  async cobrar(e) {
    await new Promise((r) => setTimeout(r, 600)); // latencia de red simulada
    const ref = `SIM-${randomUUID().slice(0, 12).toUpperCase()}`;

    if (e.metodo === "PSE") {
      const banco = e.pse?.banco ?? "";
      if (!banco) return { aprobado: false, codigo: "NO_BANK", mensaje: "Selecciona un banco.", referenciaPasarela: ref };
      if (banco.includes("rechaza"))
        return { aprobado: false, codigo: "REJECTED", mensaje: "La transacción PSE fue rechazada por el banco.", referenciaPasarela: ref, banco };
      return { aprobado: true, codigo: "APPROVED", mensaje: "Pago PSE aprobado.", referenciaPasarela: ref, banco };
    }

    const t = e.tarjeta!;
    const marca = marcaTarjeta(t.numero);
    const ultimos4 = t.numero.slice(-4);
    if (!luhn(t.numero)) return { aprobado: false, codigo: "INVALID_NUMBER", mensaje: "El número de tarjeta no es válido.", referenciaPasarela: ref, marcaTarjeta: marca, ultimos4 };
    if (vencida(t.expiracion)) return { aprobado: false, codigo: "EXPIRED_CARD", mensaje: "La tarjeta está vencida.", referenciaPasarela: ref, marcaTarjeta: marca, ultimos4 };
    const rechazo = RECHAZOS[t.numero];
    if (rechazo) return { aprobado: false, ...rechazo, referenciaPasarela: ref, marcaTarjeta: marca, ultimos4 };
    return { aprobado: true, codigo: "APPROVED", mensaje: "Pago aprobado.", referenciaPasarela: ref, marcaTarjeta: marca, ultimos4 };
  },
};

export const pasarela: Pasarela = pasarelaSimulada;
