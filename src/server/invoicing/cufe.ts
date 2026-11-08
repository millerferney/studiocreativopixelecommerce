import { createHash } from "node:crypto";

export interface DatosCufe {
  numeroFactura: string; // prefijo + consecutivo
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm:ss-05:00
  valorFactura: number; // subtotal antes de impuestos (base)
  iva: number;
  total: number;
  nitEmisor: string;
  numeroAdquirente: string;
  claveTecnica: string;
  ambiente: "1" | "2";
}

const f2 = (n: number) => n.toFixed(2);

/**
 * CUFE = SHA-384( NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 + ValImp2 +
 *                 CodImp3 + ValImp3 + ValTot + NitOFE + NumAdq + ClTec + TipoAmbiente )
 * CodImp1=01 (IVA), CodImp2=04 (INC), CodImp3=03 (ICA). Estructura del Anexo Técnico de Factura
 * Electrónica de Venta (DIAN). En producción el cálculo y la firma los valida el proveedor tecnológico.
 */
export function calcularCufe(d: DatosCufe): string {
  const cadena = [
    d.numeroFactura, d.fecha, d.hora, f2(d.valorFactura),
    "01", f2(d.iva), "04", "0.00", "03", "0.00",
    f2(d.total), d.nitEmisor, d.numeroAdquirente, d.claveTecnica, d.ambiente,
  ].join("");
  return createHash("sha384").update(cadena).digest("hex");
}

export function urlQrDian(cufe: string, ambiente: "1" | "2") {
  const host = ambiente === "1" ? "catalogo-vpfe.dian.gov.co" : "catalogo-vpfe-hab.dian.gov.co";
  return `https://${host}/document/searchqr?documentkey=${cufe}`;
}
