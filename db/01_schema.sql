-- =====================================================================
-- Studio Creativo Pixel — Esquema de producción (PostgreSQL 15+ / Supabase)
-- Módulo PPO (Pedidos y Pago Online) + catálogo + facturación electrónica
-- Ejecutar completo en: Supabase > SQL Editor, o con psql -f
-- Es idempotente a nivel de objetos: usa IF NOT EXISTS donde es posible.
-- =====================================================================

SET client_encoding = 'UTF8';

-- ---------- Utilidades ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- 1. Seguridad: roles y usuarios ----------
CREATE TABLE IF NOT EXISTS rol (
  id_rol      SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE
              CHECK (nombre IN ('CLIENTE','ADMINISTRADOR','DISENADOR')),
  descripcion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100),
  email            VARCHAR(160) NOT NULL,
  telefono         VARCHAR(30),
  password_hash    VARCHAR(100) NOT NULL,            -- BCrypt (compatible con Spring Security)
  estado           VARCHAR(10)  NOT NULL DEFAULT 'ACTIVO'
                   CHECK (estado IN ('ACTIVO','BLOQUEADO')),
  acepta_terminos_at TIMESTAMPTZ,                    -- Ley 1581 de 2012 (habeas data)
  ultimo_login     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuario_email ON usuario (lower(email));

CREATE TABLE IF NOT EXISTS usuario_rol (
  id_usuario INTEGER   NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_rol     SMALLINT NOT NULL REFERENCES rol(id_rol),
  PRIMARY KEY (id_usuario, id_rol)
);

-- Herencia Usuario -> Cliente / Administrador (tabla por subclase, PK compartida)
CREATE TABLE IF NOT EXISTS cliente (
  id_usuario       INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  tipo_documento   VARCHAR(5)  CHECK (tipo_documento IN ('CC','CE','NIT','PAS','TI')),
  numero_documento VARCHAR(20),
  direccion        VARCHAR(200),
  ciudad           VARCHAR(80),
  departamento     VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS administrador (
  id_usuario INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  cargo      VARCHAR(80)
);

-- ---------- 2. Catálogo ----------
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL UNIQUE,
  descripcion  VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicio_producto (
  id_servicio    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  descripcion    TEXT,
  precio         NUMERIC(14,2) NOT NULL CHECK (precio > 0),   -- COP, sin IVA
  tiempo_entrega INTEGER NOT NULL CHECK (tiempo_entrega > 0), -- días hábiles
  estado         VARCHAR(15) NOT NULL DEFAULT 'DISPONIBLE'
                 CHECK (estado IN ('DISPONIBLE','NO_DISPONIBLE')),
  tipo           VARCHAR(10) NOT NULL DEFAULT 'PRODUCTO'
                 CHECK (tipo IN ('PRODUCTO','SERVICIO')),
  imagen_url     VARCHAR(255),
  badge          VARCHAR(20),                                 -- OFERTA, NUEVO, PRO
  destacado      BOOLEAN NOT NULL DEFAULT FALSE,
  id_categoria   INTEGER NOT NULL REFERENCES categoria(id_categoria) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_servicio_categoria ON servicio_producto (id_categoria);
CREATE INDEX IF NOT EXISTS ix_servicio_estado    ON servicio_producto (estado);

-- Opciones de personalización por producto (tallas y materiales de la web)
CREATE TABLE IF NOT EXISTS opcion_producto (
  id_opcion   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_servicio INTEGER NOT NULL REFERENCES servicio_producto(id_servicio) ON DELETE CASCADE,
  tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('TALLA','MATERIAL')),
  valor       VARCHAR(60) NOT NULL,
  orden       SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (id_servicio, tipo, valor)
);

-- Paleta de colores y plantillas de diseño base (paso 01 y 02 de /personalizar)
CREATE TABLE IF NOT EXISTS color_paleta (
  id_color SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre   VARCHAR(40) NOT NULL UNIQUE,
  hex      CHAR(7)     NOT NULL UNIQUE CHECK (hex ~ '^#[0-9A-Fa-f]{6}$'),
  orden    SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS estilo_diseno (
  id_estilo   SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,   -- minimal, gradient, geometric, neon, retro, custom
  etiqueta    VARCHAR(40) NOT NULL,
  descripcion VARCHAR(80),
  icono       VARCHAR(8),
  orden       SMALLINT NOT NULL DEFAULT 0
);

-- ---------- 3. Carrito ----------
CREATE TABLE IF NOT EXISTS carrito (
  id_carrito  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente  INTEGER NOT NULL REFERENCES cliente(id_usuario) ON DELETE CASCADE,
  estado      VARCHAR(12) NOT NULL DEFAULT 'ABIERTO'
              CHECK (estado IN ('ABIERTO','CONVERTIDO','ABANDONADO')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Un cliente solo puede tener un carrito ABIERTO a la vez
CREATE UNIQUE INDEX IF NOT EXISTS ux_carrito_abierto ON carrito (id_cliente) WHERE estado = 'ABIERTO';

CREATE TABLE IF NOT EXISTS item_carrito (
  id_item          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_carrito       INTEGER NOT NULL REFERENCES carrito(id_carrito) ON DELETE CASCADE,
  id_servicio      INTEGER NOT NULL REFERENCES servicio_producto(id_servicio),
  cantidad         INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 99),
  talla            VARCHAR(60),
  material         VARCHAR(60),
  color_hex        CHAR(7),
  id_estilo        SMALLINT REFERENCES estilo_diseno(id_estilo),
  archivo_diseno   VARCHAR(255),          -- ruta en Supabase Storage (bucket "disenos")
  notas            VARCHAR(500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_item_carrito ON item_carrito (id_carrito);

-- ---------- 4. Pedidos ----------
CREATE SEQUENCE IF NOT EXISTS seq_numero_pedido START 1001;
CREATE SEQUENCE IF NOT EXISTS seq_numero_orden  START 1;

CREATE TABLE IF NOT EXISTS pedido (
  id_pedido        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_pedido    VARCHAR(20) NOT NULL UNIQUE
                   DEFAULT ('PEDIDO-' || nextval('seq_numero_pedido')),
  id_cliente       INTEGER NOT NULL REFERENCES cliente(id_usuario),
  estado           VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado IN ('PENDIENTE','PAGADO','EN_DISENO','EN_PRODUCCION',
                                     'ENVIADO','RECIBIDO','CANCELADO')),
  subtotal         NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
  descuento        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  iva              NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
  total            NUMERIC(14,2) NOT NULL CHECK (total >= 0),
  -- Datos del formulario de checkout (snapshot, no cambian si el cliente edita su perfil)
  nombre_completo  VARCHAR(160) NOT NULL,
  tipo_documento   VARCHAR(5)   NOT NULL CHECK (tipo_documento IN ('CC','CE','NIT','PAS','TI')),
  numero_documento VARCHAR(20)  NOT NULL,
  email_contacto   VARCHAR(160) NOT NULL,
  telefono         VARCHAR(30),
  direccion_envio  VARCHAR(200) NOT NULL,
  ciudad           VARCHAR(80)  NOT NULL,
  departamento     VARCHAR(80)  NOT NULL,
  fecha_estimada_entrega DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_pedido_cliente ON pedido (id_cliente, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_pedido_estado  ON pedido (estado);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pedido       INTEGER NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  id_servicio     INTEGER NOT NULL REFERENCES servicio_producto(id_servicio),
  nombre_item     VARCHAR(120) NOT NULL,           -- snapshot del nombre
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(14,2) NOT NULL CHECK (precio_unitario > 0),
  subtotal        NUMERIC(14,2) NOT NULL CHECK (subtotal > 0),
  talla           VARCHAR(60),
  material        VARCHAR(60),
  color_hex       CHAR(7),
  estilo_diseno   VARCHAR(40),
  archivo_diseno  VARCHAR(255),
  notas           VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS ix_detalle_pedido ON detalle_pedido (id_pedido);

CREATE TABLE IF NOT EXISTS historial_estado_pedido (
  id_historial    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pedido       INTEGER NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  estado_anterior VARCHAR(15),
  estado_nuevo    VARCHAR(15) NOT NULL,
  id_usuario      INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  comentario      VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_historial_pedido ON historial_estado_pedido (id_pedido, created_at);

-- ---------- 5. Pagos ----------
-- Nunca se guarda número de tarjeta completo ni CVV (PCI-DSS): solo marca y últimos 4.
CREATE TABLE IF NOT EXISTS pago (
  id_pago        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pedido      INTEGER NOT NULL REFERENCES pedido(id_pedido),
  metodo         VARCHAR(15) NOT NULL CHECK (metodo IN ('PSE','TARJETA','TRANSFERENCIA')),
  estado         VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE'
                 CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO','REEMBOLSADO')),
  monto          NUMERIC(14,2) NOT NULL CHECK (monto >= 0),
  moneda         CHAR(3) NOT NULL DEFAULT 'COP',
  pasarela       VARCHAR(30) NOT NULL DEFAULT 'SIMULADA',  -- Wompi, PayU, Stripe... en producción
  referencia     VARCHAR(60) NOT NULL UNIQUE,              -- referencia interna de la transacción
  referencia_pasarela VARCHAR(80),
  marca_tarjeta  VARCHAR(20),
  ultimos4       CHAR(4),
  banco          VARCHAR(80),                              -- PSE
  codigo_respuesta VARCHAR(20),
  mensaje        VARCHAR(255),
  fecha_pago     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_pago_pedido ON pago (id_pedido);
-- Máximo un pago APROBADO por pedido
CREATE UNIQUE INDEX IF NOT EXISTS ux_pago_aprobado ON pago (id_pedido) WHERE estado = 'APROBADO';

-- ---------- 6. Producción y notificaciones ----------
CREATE TABLE IF NOT EXISTS orden_trabajo (
  id_orden     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_orden VARCHAR(20) NOT NULL UNIQUE DEFAULT ('OT-' || lpad(nextval('seq_numero_orden')::text, 6, '0')),
  id_pedido    INTEGER NOT NULL UNIQUE REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  id_disenador INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  estado       VARCHAR(15) NOT NULL DEFAULT 'EN_COLA'
               CHECK (estado IN ('EN_COLA','EN_DISENO','EN_PRODUCCION','CONTROL_CALIDAD','TERMINADA')),
  prioridad    SMALLINT NOT NULL DEFAULT 2 CHECK (prioridad BETWEEN 1 AND 3),
  notas        VARCHAR(500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario      INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_pedido       INTEGER REFERENCES pedido(id_pedido) ON DELETE SET NULL,
  tipo            VARCHAR(20) NOT NULL
                  CHECK (tipo IN ('PEDIDO','PAGO','FACTURA','PRODUCCION','SISTEMA')),
  titulo          VARCHAR(120) NOT NULL,
  mensaje         VARCHAR(500) NOT NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_notif_usuario ON notificacion (id_usuario, leida, created_at DESC);

-- Registro de correos transaccionales (auditoría de envíos)
CREATE TABLE IF NOT EXISTS correo_enviado (
  id_correo    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario   INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  id_pedido    INTEGER REFERENCES pedido(id_pedido) ON DELETE SET NULL,
  destinatario VARCHAR(160) NOT NULL,
  plantilla    VARCHAR(40)  NOT NULL,
  asunto       VARCHAR(200) NOT NULL,
  estado       VARCHAR(10)  NOT NULL CHECK (estado IN ('ENVIADO','ERROR','OMITIDO')),
  proveedor    VARCHAR(20)  NOT NULL,
  id_externo   VARCHAR(100),
  error        VARCHAR(500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_correo_fecha  ON correo_enviado (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_correo_pedido ON correo_enviado (id_pedido);

-- ---------- 7. Facturación electrónica ----------
-- Datos del emisor (una sola fila, id = 1)
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id                  SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  razon_social        VARCHAR(160) NOT NULL,
  nit                 VARCHAR(20)  NOT NULL,
  digito_verificacion CHAR(1)      NOT NULL,
  regimen             VARCHAR(40)  NOT NULL DEFAULT 'Responsable de IVA',
  direccion           VARCHAR(200) NOT NULL,
  ciudad              VARCHAR(80)  NOT NULL,
  departamento        VARCHAR(80)  NOT NULL,
  codigo_municipio    VARCHAR(5)   NOT NULL DEFAULT '11001',
  telefono            VARCHAR(30),
  email               VARCHAR(160),
  iva_porcentaje      NUMERIC(5,2) NOT NULL DEFAULT 19.00,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resolución de numeración DIAN (rango autorizado de facturación)
CREATE TABLE IF NOT EXISTS resolucion_facturacion (
  id_resolucion  SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero         VARCHAR(30) NOT NULL,
  prefijo        VARCHAR(6)  NOT NULL,
  desde          INTEGER NOT NULL,
  hasta          INTEGER NOT NULL,
  consecutivo_actual INTEGER NOT NULL,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE NOT NULL,
  clave_tecnica  VARCHAR(100) NOT NULL,      -- la entrega la DIAN / el proveedor tecnológico
  ambiente       CHAR(1) NOT NULL DEFAULT '2' CHECK (ambiente IN ('1','2')),  -- 1 producción, 2 pruebas
  activa         BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (hasta >= desde AND consecutivo_actual BETWEEN desde - 1 AND hasta)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_resolucion_activa ON resolucion_facturacion (prefijo) WHERE activa;

CREATE TABLE IF NOT EXISTS factura (
  id_factura       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pedido        INTEGER NOT NULL UNIQUE REFERENCES pedido(id_pedido),
  id_pago          INTEGER NOT NULL UNIQUE REFERENCES pago(id_pago),
  id_resolucion    SMALLINT NOT NULL REFERENCES resolucion_facturacion(id_resolucion),
  prefijo          VARCHAR(6) NOT NULL,
  consecutivo      INTEGER NOT NULL,
  numero_factura   VARCHAR(20) NOT NULL UNIQUE,
  cufe             CHAR(96) NOT NULL UNIQUE,         -- SHA-384 en hexadecimal
  estado           VARCHAR(12) NOT NULL DEFAULT 'EMITIDA'
                   CHECK (estado IN ('EMITIDA','ACEPTADA','RECHAZADA','ANULADA')),
  ambiente         CHAR(1) NOT NULL DEFAULT '2',
  proveedor        VARCHAR(30) NOT NULL DEFAULT 'SIMULADO',
  fecha_emision    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Adquirente (snapshot)
  adquirente_nombre VARCHAR(160) NOT NULL,
  adquirente_tipo_documento VARCHAR(5) NOT NULL,
  adquirente_documento VARCHAR(20) NOT NULL,
  adquirente_email VARCHAR(160) NOT NULL,
  adquirente_direccion VARCHAR(200),
  -- Totales
  subtotal         NUMERIC(14,2) NOT NULL,
  descuento        NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_gravable    NUMERIC(14,2) NOT NULL,
  iva_porcentaje   NUMERIC(5,2)  NOT NULL,
  iva              NUMERIC(14,2) NOT NULL,
  total            NUMERIC(14,2) NOT NULL,
  xml_ubl          TEXT NOT NULL,
  qr_data          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_resolucion, consecutivo)
);

CREATE TABLE IF NOT EXISTS factura_item (
  id_factura_item INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_factura      INTEGER NOT NULL REFERENCES factura(id_factura) ON DELETE CASCADE,
  linea           SMALLINT NOT NULL,
  descripcion     VARCHAR(255) NOT NULL,
  cantidad        INTEGER NOT NULL,
  precio_unitario NUMERIC(14,2) NOT NULL,
  subtotal        NUMERIC(14,2) NOT NULL,
  UNIQUE (id_factura, linea)
);

-- El consecutivo de factura lo toma la app con SELECT ... FOR UPDATE sobre resolucion_facturacion
-- (mismo mecanismo en PostgreSQL y MySQL), validando rango y vigencia.

-- ---------- 8. Triggers updated_at ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['usuario','categoria','servicio_producto','carrito','pedido',
                            'orden_trabajo','configuracion_empresa'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON %1$I', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON %1$I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- ---------- 9. Vistas para reportes y dashboard ----------
CREATE OR REPLACE VIEW v_historial_pedidos AS
SELECT p.id_pedido, p.numero_pedido, p.id_cliente, p.estado, p.total, p.created_at,
       p.fecha_estimada_entrega, f.numero_factura,
       (SELECT string_agg(d.nombre_item, ', ' ORDER BY d.id_detalle)
          FROM detalle_pedido d WHERE d.id_pedido = p.id_pedido) AS items
  FROM pedido p LEFT JOIN factura f ON f.id_pedido = p.id_pedido;

CREATE OR REPLACE VIEW v_ventas_diarias AS
SELECT date_trunc('day', pg.fecha_pago)::date AS dia,
       count(*) AS pagos, sum(pg.monto) AS total_vendido
  FROM pago pg WHERE pg.estado = 'APROBADO'
 GROUP BY 1 ORDER BY 1 DESC;

-- ---------- 10. Seguridad (Supabase): RLS activado sin políticas ----------
-- La app accede con la conexión directa/pooler (rol postgres, que omite RLS).
-- Con RLS activo y sin políticas, la API pública de Supabase (anon / authenticated)
-- NO puede leer ni escribir ninguna tabla.
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
