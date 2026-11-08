import { z } from "zod";

const texto = (max: number, msg = "Campo obligatorio.") => z.string().trim().min(1, msg).max(max, `Máximo ${max} caracteres.`);
const opcional = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres.`).nullish().transform((v) => (v ? v : null));

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres.")
  .max(72, "Máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra.")
  .regex(/\d/, "Debe incluir al menos un número.");

export const emailSchema = z.string().trim().toLowerCase().email("Correo electrónico inválido.").max(160);

export const TIPOS_DOC = ["CC", "CE", "NIT", "PAS", "TI"] as const;

// ── Auth / usuarios ──
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Ingresa tu contraseña.") });

export const registroSchema = z.object({
  nombre: texto(100, "Los nombres son obligatorios."),
  apellido: opcional(100),
  email: emailSchema,
  telefono: opcional(30),
  password: passwordSchema,
  direccion: opcional(200),
  aceptaTerminos: z.literal(true, { error: "Debes aceptar los términos y el tratamiento de datos." }),
});

export const usuarioCrearSchema = z.object({
  nombre: texto(100),
  apellido: opcional(100),
  email: emailSchema,
  telefono: opcional(30),
  password: passwordSchema,
  rol: z.enum(["CLIENTE", "ADMINISTRADOR", "DISENADOR"], { error: "Rol inválido." }),
  direccion: opcional(200),
  cargo: opcional(80),
});

export const usuarioActualizarSchema = z.object({
  nombre: texto(100),
  apellido: opcional(100),
  telefono: opcional(30),
  estado: z.enum(["ACTIVO", "BLOQUEADO"], { error: "Estado inválido." }),
  password: passwordSchema.optional().or(z.literal("").transform(() => undefined)),
});

// ── Catálogo ──
export const categoriaSchema = z.object({ nombre: texto(80, "El nombre es obligatorio."), descripcion: opcional(255) });

export const servicioSchema = z.object({
  nombre: texto(120, "El nombre es obligatorio."),
  descripcion: opcional(2000),
  precio: z.coerce.number({ error: "El precio debe ser numérico." }).positive("El precio debe ser mayor que 0.").max(99_999_999),
  tiempoEntrega: z.coerce.number().int("Debe ser un número entero.").positive("El tiempo de entrega debe ser mayor que 0.").max(365),
  estado: z.enum(["DISPONIBLE", "NO_DISPONIBLE"]).default("DISPONIBLE"),
  tipo: z.enum(["PRODUCTO", "SERVICIO"]).default("PRODUCTO"),
  imagenUrl: opcional(255),
  badge: opcional(20),
  destacado: z.boolean().default(false),
  idCategoria: z.coerce.number().int().positive("Selecciona una categoría."),
  tallas: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  materiales: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
});

// ── Carrito ──
export const itemCarritoSchema = z.object({
  idServicio: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().min(1).max(99),
  talla: opcional(60),
  material: opcional(60),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido.").nullish().transform((v) => v ?? null),
  estilo: opcional(20), // código del estilo (minimal, neon, ...)
  archivoDiseno: opcional(255),
  notas: opcional(500),
});
export const carritoSchema = z.object({ items: z.array(itemCarritoSchema).max(50) });

// ── Checkout ──
export const datosEnvioSchema = z.object({
  nombreCompleto: texto(160, "Ingresa tu nombre completo."),
  tipoDocumento: z.enum(TIPOS_DOC, { error: "Selecciona el tipo de documento." }),
  numeroDocumento: z.string().trim().regex(/^[0-9A-Za-z-]{5,20}$/, "Documento inválido (5–20 caracteres)."),
  email: emailSchema,
  telefono: z.string().trim().regex(/^[0-9+() -]{7,20}$/, "Teléfono inválido."),
  direccion: texto(200, "Ingresa la dirección de envío."),
  ciudad: texto(80, "Ingresa la ciudad."),
  departamento: texto(80, "Ingresa el departamento."),
});

export const pagoSchema = z.discriminatedUnion("metodo", [
  z.object({
    metodo: z.literal("TARJETA"),
    numero: z.string().trim().transform((v) => v.replace(/[\s-]/g, "")).pipe(z.string().regex(/^\d{13,19}$/, "Número de tarjeta inválido.")),
    expiracion: z.string().trim().regex(/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, "Usa el formato MM/YY."),
    cvv: z.string().trim().regex(/^\d{3,4}$/, "CVV inválido."),
  }),
  z.object({
    metodo: z.literal("PSE"),
    banco: texto(80, "Selecciona tu banco."),
    tipoPersona: z.enum(["NATURAL", "JURIDICA"]).default("NATURAL"),
  }),
]);

export const checkoutSchema = z.object({
  items: z.array(itemCarritoSchema).min(1, "Tu carrito está vacío.").max(50),
  envio: datosEnvioSchema,
  pago: pagoSchema,
});

export const pagarPedidoSchema = z.object({ pago: pagoSchema });

export const cambiarEstadoPedidoSchema = z.object({
  estado: z.enum(["EN_DISENO", "EN_PRODUCCION", "ENVIADO", "RECIBIDO", "CANCELADO"]),
  comentario: opcional(255),
});
