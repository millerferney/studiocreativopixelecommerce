import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { PrintButton } from "@/components/tienda/PrintButton";
import { usuarioActual } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { formatCOP, num } from "@/lib/money";
import { db } from "@/lib/db";
import { fechaHoraColombia, obtenerFacturaPorNumero } from "@/server/services/facturacion";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  return { title: `Factura ${(await params).numero}`, robots: { index: false } };
}

export default async function FacturaPage({ params }: { params: Promise<{ numero: string }> }) {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  const { numero } = await params;
  let f;
  try { f = await obtenerFacturaPorNumero(numero); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); throw e; }
  if (f.pedido.idCliente !== u.idUsuario && !u.roles.includes("ADMINISTRADOR")) notFound();

  const empresa = await db.configuracionEmpresa.findUnique({ where: { id: 1 } });
  const qr = await QRCode.toDataURL(f.qrData, { margin: 1, width: 180 });
  const { fecha, hora } = fechaHoraColombia(f.fechaEmision);
  const prueba = f.ambiente === "2";
  const volver = u.roles.includes("ADMINISTRADOR") && f.pedido.idCliente !== u.idUsuario ? "/admin/facturas" : "/cuenta/facturas";

  return (
    <main className="py-10 px-4 min-h-screen">
      <div className="no-print max-w-[820px] mx-auto mb-6 flex flex-wrap gap-3 justify-between items-center">
        <Link href={volver} className="font-mono text-xs text-px-cyan hover:text-white">← Volver</Link>
        <div className="flex gap-3">
          <a href={`/api/facturas/${f.numeroFactura}/xml`} className="btn-secondary">Descargar XML</a>
          <PrintButton />
        </div>
      </div>

      <article className="factura-paper" aria-label={`Factura electrónica ${f.numeroFactura}`}>
        {prueba && (
          <p style={{ background: "#FEF3C7", color: "#92400E", padding: "8px 12px", borderRadius: 4, fontSize: 11, marginBottom: 20 }}>
            <strong>DOCUMENTO DE PRUEBAS.</strong> Factura generada en ambiente de habilitación (simulado): no tiene validez fiscal ante la DIAN.
          </p>
        )}
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20 }}>{empresa?.razonSocial}</h1>
            <p style={{ margin: "4px 0 0" }}>NIT {empresa?.nit}-{empresa?.digitoVerificacion} · {empresa?.regimen}</p>
            <p style={{ margin: 0 }}>{empresa?.direccion}, {empresa?.ciudad}, {empresa?.departamento}</p>
            <p style={{ margin: 0 }}>{empresa?.telefono} · {empresa?.email}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: 14, textTransform: "uppercase", color: "#6B7280" }}>Factura electrónica de venta</h2>
            <p className="mono" style={{ fontSize: 20, fontWeight: 700, margin: "4px 0" }}>{f.numeroFactura}</p>
            <p style={{ margin: 0 }}>Fecha: {fecha} {hora}</p>
            <p style={{ margin: 0 }}>Pedido: {f.pedido.numeroPedido}</p>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <div>
            <h3 style={{ fontSize: 11, textTransform: "uppercase", color: "#6B7280", marginBottom: 4 }}>Adquirente</h3>
            <p style={{ margin: 0, fontWeight: 600 }}>{f.adquirenteNombre}</p>
            <p style={{ margin: 0 }}>{f.adquirenteTipoDocumento} {f.adquirenteDocumento}</p>
            <p style={{ margin: 0 }}>{f.adquirenteDireccion}</p>
            <p style={{ margin: 0 }}>{f.adquirenteEmail}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 11, textTransform: "uppercase", color: "#6B7280", marginBottom: 4 }}>Resolución de numeración</h3>
            <p style={{ margin: 0 }}>N.º {f.resolucionFacturacion.numero} · Prefijo {f.resolucionFacturacion.prefijo}</p>
            <p style={{ margin: 0 }}>Rango {f.resolucionFacturacion.desde} a {f.resolucionFacturacion.hasta}</p>
            <p style={{ margin: 0 }}>Vigencia {f.resolucionFacturacion.fechaInicio.toISOString().slice(0, 10)} a {f.resolucionFacturacion.fechaFin.toISOString().slice(0, 10)}</p>
            <p style={{ margin: 0 }}>Forma de pago: Contado · Moneda COP</p>
          </div>
        </section>

        <table>
          <thead><tr><th>#</th><th>Descripción</th><th className="num">Cant.</th><th className="num">Vr. unitario</th><th className="num">Vr. total</th></tr></thead>
          <tbody>
            {f.facturaItems.map((i) => (
              <tr key={i.idFacturaItem}><td>{i.linea}</td><td>{i.descripcion}</td><td className="num">{i.cantidad}</td><td className="num">{formatCOP(num(i.precioUnitario))}</td><td className="num">{formatCOP(num(i.subtotal))}</td></tr>
            ))}
          </tbody>
        </table>

        <section style={{ display: "flex", justifyContent: "space-between", gap: 24, marginTop: 20, alignItems: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR de la factura" width={150} height={150} />
          <table style={{ maxWidth: 320 }}>
            <tbody>
              <tr><td>Subtotal</td><td className="num">{formatCOP(num(f.subtotal))}</td></tr>
              <tr><td>Descuento</td><td className="num">-{formatCOP(num(f.descuento))}</td></tr>
              <tr><td>Base gravable</td><td className="num">{formatCOP(num(f.baseGravable))}</td></tr>
              <tr><td>IVA {num(f.ivaPorcentaje)}%</td><td className="num">{formatCOP(num(f.iva))}</td></tr>
              <tr><td style={{ fontWeight: 700, fontSize: 15 }}>TOTAL A PAGAR</td><td className="num" style={{ fontWeight: 700, fontSize: 15 }}>{formatCOP(num(f.total))}</td></tr>
            </tbody>
          </table>
        </section>

        <footer style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #E5E7EB", fontSize: 10, color: "#6B7280" }}>
          <p style={{ margin: "0 0 4px" }}><strong>CUFE:</strong> <span className="mono">{f.cufe}</span></p>
          <p style={{ margin: 0 }}>Estado: {f.estado} · Proveedor: {f.proveedor} · Ambiente: {prueba ? "Pruebas (habilitación)" : "Producción"}</p>
        </footer>
      </article>
    </main>
  );
}
