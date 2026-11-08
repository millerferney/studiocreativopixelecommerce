import "server-only";
import { ApiError } from "@/lib/http";
import { calcularCufe, urlQrDian, type DatosCufe } from "./cufe";
import { generarXmlUbl, type DatosUbl } from "./ubl";

/**
 * Adaptador de proveedor de facturación electrónica.
 * - SIMULADO (por defecto): calcula CUFE y genera el XML UBL 2.1 localmente. Sin firma ni envío a la DIAN.
 * - Para producción: implementar `ProveedorFactura` con la API de un proveedor tecnológico autorizado por la
 *   DIAN (envía el documento, firma, obtiene el CUFE/ZIP/estado) y registrarlo en `obtenerProveedor`.
 */
export interface ResultadoProveedor {
  cufe: string;
  xml: string;
  qr: string;
  estado: "EMITIDA" | "ACEPTADA" | "RECHAZADA";
  proveedor: string;
}
export interface ProveedorFactura {
  nombre: string;
  emitir(cufe: DatosCufe, ubl: Omit<DatosUbl, "cufe">): Promise<ResultadoProveedor>;
}

const simulado: ProveedorFactura = {
  nombre: "SIMULADO",
  async emitir(datosCufe, ubl) {
    const cufe = calcularCufe(datosCufe);
    return { cufe, xml: generarXmlUbl({ ...ubl, cufe }), qr: urlQrDian(cufe, datosCufe.ambiente), estado: "EMITIDA", proveedor: "SIMULADO" };
  },
};

export function obtenerProveedor(): ProveedorFactura {
  const nombre = (process.env.INVOICE_PROVIDER ?? "SIMULADO").toUpperCase();
  if (nombre === "SIMULADO") return simulado;
  throw new ApiError(500, `Proveedor de facturación "${nombre}" no implementado. Ver README > Facturación electrónica.`);
}
