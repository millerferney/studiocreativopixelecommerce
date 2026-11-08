import { formatCOP } from "@/lib/money";

/** Plantillas de correo (HTML compatible con clientes de correo: tablas + estilos en línea, texto plano de respaldo). */

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const urlBase = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Paleta con contraste verificado sobre blanco (≥ 4.5:1): tinta #0F172A, texto #334155, acento #0E7490, verde #15803D.
const C = { fondo: "#F1F5F9", tarjeta: "#FFFFFF", tinta: "#0F172A", texto: "#334155", suave: "#475569", borde: "#E2E8F0", cyan: "#0E7490", verde: "#15803D", rojo: "#B91C1C", violeta: "#6D28D9" };

export interface Contenido {
  asunto: string;
  preheader: string;
  titulo: string;
  acento?: "cyan" | "verde" | "rojo" | "violeta";
  parrafos: string[];
  filas?: [string, string][];
  items?: { nombre: string; detalle: string; cantidad: number; subtotal: number }[];
  totales?: { subtotal: number; descuento: number; iva: number; total: number };
  cta?: { texto: string; url: string };
  nota?: string;
}

export function renderizar(c: Contenido): { asunto: string; html: string; texto: string } {
  const acento = C[c.acento ?? "cyan"];
  const filas = (c.filas ?? []).map(([k, v]) => `<tr><td style="padding:6px 0;color:${C.suave};font-size:13px;width:42%">${esc(k)}</td><td style="padding:6px 0;color:${C.tinta};font-size:14px;font-weight:600">${esc(v)}</td></tr>`).join("");
  const items = (c.items ?? []).map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.borde};color:${C.tinta};font-size:14px">${esc(i.nombre)}${i.detalle ? `<br><span style="color:${C.suave};font-size:12px">${esc(i.detalle)}</span>` : ""}</td><td style="padding:10px 8px;border-bottom:1px solid ${C.borde};color:${C.texto};font-size:14px;text-align:center">×${i.cantidad}</td><td style="padding:10px 0;border-bottom:1px solid ${C.borde};color:${C.tinta};font-size:14px;text-align:right;white-space:nowrap">${formatCOP(i.subtotal)}</td></tr>`).join("");
  const t = c.totales;
  const totales = t
    ? `<table role="presentation" width="100%" style="margin-top:12px;border-collapse:collapse"><tr><td style="color:${C.suave};font-size:13px;padding:3px 0">Subtotal</td><td style="text-align:right;color:${C.texto};font-size:13px">${formatCOP(t.subtotal)}</td></tr><tr><td style="color:${C.suave};font-size:13px;padding:3px 0">Descuento</td><td style="text-align:right;color:${C.verde};font-size:13px">-${formatCOP(t.descuento)}</td></tr><tr><td style="color:${C.suave};font-size:13px;padding:3px 0">IVA</td><td style="text-align:right;color:${C.texto};font-size:13px">${formatCOP(t.iva)}</td></tr><tr><td style="padding:10px 0 0;color:${C.tinta};font-size:16px;font-weight:700;border-top:2px solid ${C.tinta}">Total</td><td style="padding:10px 0 0;text-align:right;color:${C.tinta};font-size:18px;font-weight:700;border-top:2px solid ${C.tinta}">${formatCOP(t.total)}</td></tr></table>`
    : "";
  const cta = c.cta
    ? `<table role="presentation" style="margin:24px 0 4px"><tr><td style="background:${acento};border-radius:8px"><a href="${esc(c.cta.url)}" style="display:inline-block;padding:13px 26px;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif">${esc(c.cta.texto)}</a></td></tr></table>`
    : "";

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(c.asunto)}</title></head>
<body style="margin:0;padding:0;background:${C.fondo};font-family:Arial,Helvetica,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.tarjeta};border-radius:12px;overflow:hidden;border:1px solid ${C.borde}">
<tr><td style="padding:24px 32px 16px"><img src="${urlBase()}/assets/brand/logo-email.png" width="200" alt="Studio Creativo Pixel" style="display:block;border:0;height:auto"></td></tr>
<tr><td style="height:4px;background:${acento};line-height:4px;font-size:4px">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 8px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${C.tinta}">${esc(c.titulo)}</h1>
${c.parrafos.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${C.texto}">${p}</p>`).join("")}
${filas ? `<table role="presentation" width="100%" style="margin:8px 0 12px;border-collapse:collapse;border-top:1px solid ${C.borde};border-bottom:1px solid ${C.borde}">${filas}</table>` : ""}
${items ? `<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:8px">${items}</table>` : ""}
${totales}${cta}
${c.nota ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${C.suave}">${c.nota}</p>` : ""}
</td></tr>
<tr><td style="padding:24px 32px 28px"><p style="margin:0;font-size:12px;line-height:1.5;color:${C.suave};border-top:1px solid ${C.borde};padding-top:16px">Studio Creativo Pixel · Sublimación, diseño y producción premium.<br>Este es un correo automático: si necesitas ayuda, responde a este mensaje o escríbenos desde <a href="${urlBase()}" style="color:${C.cyan}">nuestra tienda</a>.</p></td></tr>
</table></td></tr></table></body></html>`;

  const texto = [
    c.titulo, "", ...c.parrafos.map((p) => p.replace(/<[^>]+>/g, "")),
    ...(c.filas ?? []).map(([k, v]) => `${k}: ${v}`),
    ...(c.items?.length ? ["", ...c.items.map((i) => `- ${i.nombre}${i.detalle ? ` (${i.detalle})` : ""} x${i.cantidad}: ${formatCOP(i.subtotal)}`)] : []),
    ...(t ? ["", `Subtotal: ${formatCOP(t.subtotal)}`, `Descuento: -${formatCOP(t.descuento)}`, `IVA: ${formatCOP(t.iva)}`, `TOTAL: ${formatCOP(t.total)}`] : []),
    ...(c.cta ? ["", `${c.cta.texto}: ${c.cta.url}`] : []),
    ...(c.nota ? ["", c.nota.replace(/<[^>]+>/g, "")] : []),
    "", "— Studio Creativo Pixel",
  ].join("\n");
  return { asunto: c.asunto, html, texto };
}

/* ───────────── Datos de cada plantilla ───────────── */
export interface DatosPedido {
  numeroPedido: string; nombre: string; email: string; estado: string; total: number; subtotal: number; descuento: number; iva: number;
  fechaEstimadaEntrega: string | null; direccion: string; ciudad: string;
  items: { nombre: string; talla: string | null; material: string | null; cantidad: number; subtotal: number }[];
  pago?: { metodo: string; detalle: string; referencia: string };
  factura?: { numeroFactura: string; ambiente: string };
}

const detalleItem = (i: DatosPedido["items"][number]) => [i.talla, i.material].filter(Boolean).join(" · ");
const resumen = (p: DatosPedido) => ({ items: p.items.map((i) => ({ nombre: i.nombre, detalle: detalleItem(i), cantidad: i.cantidad, subtotal: i.subtotal })), totales: { subtotal: p.subtotal, descuento: p.descuento, iva: p.iva, total: p.total } });
const urlPedido = (p: DatosPedido) => `${urlBase()}/cuenta/pedidos/${p.numeroPedido}`;
const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? n;

export const PLANTILLAS = {
  bienvenida: (d: { nombre: string }) =>
    renderizar({
      asunto: "¡Bienvenido a Studio Creativo Pixel!", preheader: "Tu cuenta está lista: personaliza tus productos.", titulo: `¡Hola, ${esc(primerNombre(d.nombre))}!`, acento: "verde",
      parrafos: ["Tu cuenta en <strong>Studio Creativo Pixel</strong> ya está activa. Desde ahora puedes personalizar tazas, hoodies, gorras y más, y seguir cada pedido en tiempo real.", "Tus facturas electrónicas y el historial de compras quedarán guardados en tu cuenta."],
      cta: { texto: "Explorar el catálogo", url: `${urlBase()}/catalogo` },
    }),

  pago_aprobado: (p: DatosPedido) =>
    renderizar({
      asunto: `Pago aprobado · Pedido ${p.numeroPedido}`, preheader: `Recibimos tu pago de ${formatCOP(p.total)}.`, titulo: "¡Pago aprobado! Ya estamos en marcha", acento: "verde",
      parrafos: [`Hola, ${esc(primerNombre(p.nombre))}. Recibimos tu pago y tu pedido <strong>${esc(p.numeroPedido)}</strong> pasó a nuestro equipo de producción.`],
      filas: [["Pedido", p.numeroPedido], ["Medio de pago", p.pago?.detalle ?? "—"], ["Referencia", p.pago?.referencia ?? "—"], ["Entrega estimada", p.fechaEstimadaEntrega ?? "—"], ["Envío a", `${p.direccion}, ${p.ciudad}`]],
      ...resumen(p),
      cta: { texto: "Ver mi pedido", url: urlPedido(p) },
      nota: p.factura
        ? `Adjuntamos la factura electrónica <strong>${esc(p.factura.numeroFactura)}</strong> en formato XML.${p.factura.ambiente === "2" ? " <strong>Documento de pruebas: sin validez fiscal.</strong>" : ""} También puedes verla e imprimirla desde tu cuenta.`
        : "Estamos generando tu factura electrónica; te avisaremos cuando esté disponible en tu cuenta.",
    }),

  pago_rechazado: (p: DatosPedido, d: { motivo: string }) =>
    renderizar({
      asunto: `No pudimos procesar tu pago · Pedido ${p.numeroPedido}`, preheader: "Tu pedido sigue pendiente: puedes reintentar el pago.", titulo: "Tu pago no fue aprobado", acento: "rojo",
      parrafos: [`Hola, ${esc(primerNombre(p.nombre))}. El pago de tu pedido <strong>${esc(p.numeroPedido)}</strong> fue rechazado: <em>${esc(d.motivo)}</em>`, "No se realizó ningún cobro. Tu pedido quedó pendiente y puedes reintentarlo con la misma u otra forma de pago."],
      ...resumen(p),
      cta: { texto: "Reintentar el pago", url: `${urlPedido(p)}/pagar` },
    }),

  estado_pedido: (p: DatosPedido) => {
    const msg: Record<string, [string, string]> = {
      EN_DISENO: ["Tu pedido está en diseño", "Nuestro equipo de diseño está preparando tu arte con las indicaciones que nos diste."],
      EN_PRODUCCION: ["Tu pedido está en producción", "Ya estamos sublimando y produciendo tu pedido con control de calidad en cada paso."],
      ENVIADO: ["¡Tu pedido va en camino!", "Despachamos tu pedido. Llegará a la dirección de envío indicada."],
      RECIBIDO: ["Pedido entregado", "Marcamos tu pedido como recibido. ¡Gracias por confiar en Studio Creativo Pixel!"],
    };
    const [titulo, texto] = msg[p.estado] ?? ["Actualización de tu pedido", `Tu pedido cambió de estado: ${p.estado}.`];
    return renderizar({
      asunto: `${titulo} · ${p.numeroPedido}`, preheader: texto, titulo, acento: p.estado === "ENVIADO" || p.estado === "RECIBIDO" ? "verde" : "cyan",
      parrafos: [`Hola, ${esc(primerNombre(p.nombre))}. ${texto}`],
      filas: [["Pedido", p.numeroPedido], ["Entrega estimada", p.fechaEstimadaEntrega ?? "—"], ["Envío a", `${p.direccion}, ${p.ciudad}`]],
      cta: { texto: "Seguir mi pedido", url: urlPedido(p) },
    });
  },

  pedido_cancelado: (p: DatosPedido) =>
    renderizar({
      asunto: `Pedido cancelado · ${p.numeroPedido}`, preheader: "Tu pedido fue cancelado.", titulo: "Tu pedido fue cancelado", acento: "violeta",
      parrafos: [`Hola, ${esc(primerNombre(p.nombre))}. Tu pedido <strong>${esc(p.numeroPedido)}</strong> fue cancelado. Si no solicitaste la cancelación o tienes dudas, responde a este correo.`],
      ...resumen(p),
      cta: { texto: "Volver a la tienda", url: `${urlBase()}/catalogo` },
    }),

  factura_emitida: (p: DatosPedido) =>
    renderizar({
      asunto: `Tu factura electrónica ${p.factura?.numeroFactura ?? ""} · ${p.numeroPedido}`, preheader: "Ya está disponible tu factura electrónica.", titulo: "Tu factura electrónica está lista", acento: "cyan",
      parrafos: [`Hola, ${esc(primerNombre(p.nombre))}. Emitimos la factura <strong>${esc(p.factura?.numeroFactura ?? "")}</strong> de tu pedido <strong>${esc(p.numeroPedido)}</strong>. La adjuntamos en XML y también puedes verla e imprimirla desde tu cuenta.`],
      filas: [["Factura", p.factura?.numeroFactura ?? "—"], ["Total", formatCOP(p.total)]],
      cta: { texto: "Ver mi factura", url: `${urlBase()}/factura/${p.factura?.numeroFactura ?? ""}` },
      nota: p.factura?.ambiente === "2" ? "<strong>Documento de pruebas:</strong> sin validez fiscal ante la DIAN." : undefined,
    }),

  admin_nuevo_pedido: (p: DatosPedido) =>
    renderizar({
      asunto: `Nuevo pedido pagado · ${p.numeroPedido} · ${formatCOP(p.total)}`, preheader: `${p.nombre} pagó ${formatCOP(p.total)}.`, titulo: "Nuevo pedido listo para producción", acento: "verde",
      parrafos: [`<strong>${esc(p.nombre)}</strong> (${esc(p.email)}) pagó el pedido <strong>${esc(p.numeroPedido)}</strong>.`],
      filas: [["Medio de pago", p.pago?.detalle ?? "—"], ["Entrega estimada", p.fechaEstimadaEntrega ?? "—"], ["Factura", p.factura?.numeroFactura ?? "pendiente"]],
      ...resumen(p),
      cta: { texto: "Abrir en el panel", url: `${urlBase()}/admin/pedidos/${p.numeroPedido}` },
    }),

  prueba: (d: { proveedor: string }) =>
    renderizar({
      asunto: "Correo de prueba · Studio Creativo Pixel", preheader: "La configuración de correo funciona.", titulo: "La configuración de correo funciona ✓", acento: "verde",
      parrafos: [`Este es un mensaje de prueba enviado con el proveedor <strong>${esc(d.proveedor)}</strong>. Si lo estás leyendo, los correos transaccionales de la tienda están operando.`],
    }),
};

export type NombrePlantilla = keyof typeof PLANTILLAS;

export const MUESTRA: DatosPedido = {
  numeroPedido: "PEDIDO-1001", nombre: "Laura Gómez", email: "laura@ejemplo.com", estado: "EN_PRODUCCION", subtotal: 120000, descuento: 6000, iva: 21660, total: 135660,
  fechaEstimadaEntrega: "2026-11-13", direccion: "Cra 7 # 10-20", ciudad: "Bogotá",
  items: [{ nombre: "Taza Esmerilada", talla: "11oz", material: "Esmerilado", cantidad: 1, subtotal: 25000 }, { nombre: "Hoodie Tech-Spec", talla: "L", material: "Fleece", cantidad: 1, subtotal: 95000 }],
  pago: { metodo: "TARJETA", detalle: "VISA ····4242", referencia: "PAY-ABC123" }, factura: { numeroFactura: "SETP990000000", ambiente: "2" },
};
