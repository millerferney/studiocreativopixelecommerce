const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const f2 = (n: number) => n.toFixed(2);

export interface DatosUbl {
  numeroFactura: string;
  cufe: string;
  ambiente: "1" | "2";
  fecha: string;
  hora: string;
  emisor: { razonSocial: string; nit: string; dv: string; direccion: string; ciudad: string; codigoMunicipio: string; departamento: string; email: string | null };
  adquirente: { nombre: string; tipoDocumento: string; documento: string; email: string; direccion: string | null };
  resolucion: { numero: string; prefijo: string; desde: number; hasta: number; fechaInicio: string; fechaFin: string };
  items: { descripcion: string; cantidad: number; precioUnitario: number; subtotal: number }[];
  subtotal: number;
  descuento: number;
  baseGravable: number;
  ivaPorcentaje: number;
  iva: number;
  total: number;
}

const TIPO_DOC_DIAN: Record<string, string> = { CC: "13", CE: "22", NIT: "31", PAS: "41", TI: "12" };

/**
 * XML UBL 2.1 de Factura Electrónica de Venta (estructura simplificada).
 * IMPORTANTE: sin extensión de firma XAdES ni validación DIAN. Sirve como representación
 * gráfica/estructura para pruebas; el documento legal lo emite el proveedor tecnológico autorizado.
 */
export function generarXmlUbl(d: DatosUbl): string {
  const lineas = d.items
    .map(
      (it, i) => `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${it.cantidad}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">${f2(it.subtotal)}</cbc:LineExtensionAmount>
    <cac:Item><cbc:Description>${esc(it.descripcion)}</cbc:Description></cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="COP">${f2(it.precioUnitario)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Factura electrónica SIMULADA (ambiente ${d.ambiente === "1" ? "producción" : "pruebas"}). Sin firma digital ni validez ante la DIAN. -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileExecutionID>${d.ambiente}</cbc:ProfileExecutionID>
  <cbc:ID>${esc(d.numeroFactura)}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${d.cufe}</cbc:UUID>
  <cbc:IssueDate>${d.fecha}</cbc:IssueDate>
  <cbc:IssueTime>${d.hora}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${d.items.length}</cbc:LineCountNumeric>
  <cac:AuthorizationInfo>
    <cbc:ID>${esc(d.resolucion.numero)}</cbc:ID>
    <cbc:Prefix>${esc(d.resolucion.prefijo)}</cbc:Prefix>
    <cbc:From>${d.resolucion.desde}</cbc:From>
    <cbc:To>${d.resolucion.hasta}</cbc:To>
    <cbc:StartDate>${d.resolucion.fechaInicio}</cbc:StartDate>
    <cbc:EndDate>${d.resolucion.fechaFin}</cbc:EndDate>
  </cac:AuthorizationInfo>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(d.emisor.razonSocial)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID schemeID="${d.emisor.dv}" schemeName="31">${esc(d.emisor.nit)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PhysicalLocation><cac:Address>
        <cbc:ID>${d.emisor.codigoMunicipio}</cbc:ID><cbc:CityName>${esc(d.emisor.ciudad)}</cbc:CityName>
        <cbc:CountrySubentity>${esc(d.emisor.departamento)}</cbc:CountrySubentity>
        <cac:AddressLine><cbc:Line>${esc(d.emisor.direccion)}</cbc:Line></cac:AddressLine>
        <cac:Country><cbc:IdentificationCode>CO</cbc:IdentificationCode></cac:Country>
      </cac:Address></cac:PhysicalLocation>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(d.adquirente.nombre)}</cbc:Name></cac:PartyName>
      <cac:PartyTaxScheme>
        <cbc:CompanyID schemeName="${TIPO_DOC_DIAN[d.adquirente.tipoDocumento] ?? "13"}">${esc(d.adquirente.documento)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>ZZ</cbc:ID><cbc:Name>No aplica</cbc:Name></cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact><cbc:ElectronicMail>${esc(d.adquirente.email)}</cbc:ElectronicMail></cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${f2(d.iva)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${f2(d.baseGravable)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${f2(d.iva)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:Percent>${f2(d.ivaPorcentaje)}</cbc:Percent><cac:TaxScheme><cbc:ID>01</cbc:ID><cbc:Name>IVA</cbc:Name></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${f2(d.subtotal)}</cbc:LineExtensionAmount>
    <cbc:AllowanceTotalAmount currencyID="COP">${f2(d.descuento)}</cbc:AllowanceTotalAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${f2(d.baseGravable)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${f2(d.total)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${f2(d.total)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lineas}
</Invoice>
`;
}
