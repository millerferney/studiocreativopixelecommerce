-- =====================================================================
-- Studio Creativo Pixel — Esquema de producción (MySQL 8.0.19+)
-- Equivalente funcional de db/01_schema.sql (PostgreSQL). Probado en MySQL 8.0.46.
--   mysql -u USUARIO -p BASE < db/mysql/01_schema.sql
-- Requiere: InnoDB, utf8mb4, CHECK constraints (8.0.16+), defaults por expresión (8.0.13+).
-- Diferencias frente a PostgreSQL (la app las resuelve, ver README):
--   * Secuencias  -> tabla `secuencia` + triggers (numero_pedido, numero_orden)
--   * Índices únicos parciales -> columnas generadas + UNIQUE
--   * RLS de Supabase -> no existe; usa un usuario de BD con permisos mínimos y TLS
--   * Fechas en UTC: DATETIME(3) con UTC_TIMESTAMP(3)
-- =====================================================================

SET NAMES utf8mb4;

-- ---------- 1. Seguridad: roles y usuarios ----------
CREATE TABLE IF NOT EXISTS rol (
  id_rol      SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE CHECK (nombre IN ('CLIENTE','ADMINISTRADOR','DISENADOR')),
  descripcion VARCHAR(200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL,
  apellido           VARCHAR(100),
  email              VARCHAR(160) NOT NULL,                -- collation _ai_ci: único sin distinguir mayúsculas
  telefono           VARCHAR(30),
  password_hash      VARCHAR(100) NOT NULL,                -- BCrypt (compatible con Spring Security)
  estado             VARCHAR(10) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','BLOQUEADO')),
  acepta_terminos_at DATETIME(3) NULL,                     -- Ley 1581 de 2012 (habeas data)
  ultimo_login       DATETIME(3) NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at         DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  UNIQUE KEY ux_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS usuario_rol (
  id_usuario INT NOT NULL,
  id_rol     SMALLINT NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_rol)     REFERENCES rol(id_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cliente (
  id_usuario       INT NOT NULL PRIMARY KEY,
  tipo_documento   VARCHAR(5) CHECK (tipo_documento IN ('CC','CE','NIT','PAS','TI')),
  numero_documento VARCHAR(20),
  direccion        VARCHAR(200),
  ciudad           VARCHAR(80),
  departamento     VARCHAR(80),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS administrador (
  id_usuario INT NOT NULL PRIMARY KEY,
  cargo      VARCHAR(80),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 2. Catálogo ----------
CREATE TABLE IF NOT EXISTS categoria (
  id_categoria INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL UNIQUE,
  descripcion  VARCHAR(255),
  created_at   DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at   DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS servicio_producto (
  id_servicio    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  descripcion    TEXT,
  precio         DECIMAL(14,2) NOT NULL CHECK (precio > 0),            -- COP, sin IVA
  tiempo_entrega INT NOT NULL CHECK (tiempo_entrega > 0),              -- días hábiles
  estado         VARCHAR(15) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE','NO_DISPONIBLE')),
  tipo           VARCHAR(10) NOT NULL DEFAULT 'PRODUCTO' CHECK (tipo IN ('PRODUCTO','SERVICIO')),
  imagen_url     VARCHAR(255),
  badge          VARCHAR(20),
  destacado      BOOLEAN NOT NULL DEFAULT FALSE,
  id_categoria   INT NOT NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY ix_servicio_categoria (id_categoria),
  KEY ix_servicio_estado (estado),
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS opcion_producto (
  id_opcion   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_servicio INT NOT NULL,
  tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('TALLA','MATERIAL')),
  valor       VARCHAR(60) NOT NULL,
  orden       SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY ux_opcion (id_servicio, tipo, valor),
  FOREIGN KEY (id_servicio) REFERENCES servicio_producto(id_servicio) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS color_paleta (
  id_color SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(40) NOT NULL UNIQUE,
  hex      CHAR(7) NOT NULL UNIQUE CHECK (hex REGEXP '^#[0-9A-Fa-f]{6}$'),
  orden    SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS estilo_diseno (
  id_estilo   SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20) NOT NULL UNIQUE,
  etiqueta    VARCHAR(40) NOT NULL,
  descripcion VARCHAR(80),
  icono       VARCHAR(8),
  orden       SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 3. Carrito ----------
CREATE TABLE IF NOT EXISTS carrito (
  id_carrito  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_cliente  INT NOT NULL,
  estado      VARCHAR(12) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO','CONVERTIDO','ABANDONADO')),
  created_at  DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at  DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  -- Un cliente solo puede tener un carrito ABIERTO (el índice único ignora los NULL)
  abierto_flag TINYINT GENERATED ALWAYS AS (CASE WHEN estado = 'ABIERTO' THEN 1 ELSE NULL END) STORED,
  UNIQUE KEY ux_carrito_abierto (id_cliente, abierto_flag),
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_carrito (
  id_item        INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_carrito     INT NOT NULL,
  id_servicio    INT NOT NULL,
  cantidad       INT NOT NULL CHECK (cantidad BETWEEN 1 AND 99),
  talla          VARCHAR(60),
  material       VARCHAR(60),
  color_hex      CHAR(7),
  id_estilo      SMALLINT NULL,
  archivo_diseno VARCHAR(255),
  notas          VARCHAR(500),
  created_at     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY ix_item_carrito (id_carrito),
  FOREIGN KEY (id_carrito)  REFERENCES carrito(id_carrito) ON DELETE CASCADE,
  FOREIGN KEY (id_servicio) REFERENCES servicio_producto(id_servicio),
  FOREIGN KEY (id_estilo)   REFERENCES estilo_diseno(id_estilo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 4. Secuencias (MySQL no tiene SEQUENCE) ----------
CREATE TABLE IF NOT EXISTS secuencia (
  nombre VARCHAR(30) NOT NULL PRIMARY KEY,
  valor  INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT IGNORE INTO secuencia (nombre, valor) VALUES ('pedido', 1000), ('orden', 0);

-- ---------- 5. Pedidos ----------
CREATE TABLE IF NOT EXISTS pedido (
  id_pedido        INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  numero_pedido    VARCHAR(20) NOT NULL DEFAULT '' UNIQUE,   -- lo asigna el trigger trg_pedido_numero
  id_cliente       INT NOT NULL,
  estado           VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE'
                   CHECK (estado IN ('PENDIENTE','PAGADO','EN_DISENO','EN_PRODUCCION','ENVIADO','RECIBIDO','CANCELADO')),
  subtotal         DECIMAL(14,2) NOT NULL CHECK (subtotal >= 0),
  descuento        DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (descuento >= 0),
  iva              DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (iva >= 0),
  total            DECIMAL(14,2) NOT NULL CHECK (total >= 0),
  nombre_completo  VARCHAR(160) NOT NULL,
  tipo_documento   VARCHAR(5)   NOT NULL CHECK (tipo_documento IN ('CC','CE','NIT','PAS','TI')),
  numero_documento VARCHAR(20)  NOT NULL,
  email_contacto   VARCHAR(160) NOT NULL,
  telefono         VARCHAR(30),
  direccion_envio  VARCHAR(200) NOT NULL,
  ciudad           VARCHAR(80)  NOT NULL,
  departamento     VARCHAR(80)  NOT NULL,
  fecha_estimada_entrega DATE,
  created_at       DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at       DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY ix_pedido_cliente (id_cliente, created_at),
  KEY ix_pedido_estado (estado),
  FOREIGN KEY (id_cliente) REFERENCES cliente(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle      INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_pedido       INT NOT NULL,
  id_servicio     INT NOT NULL,
  nombre_item     VARCHAR(120) NOT NULL,
  cantidad        INT NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(14,2) NOT NULL CHECK (precio_unitario > 0),
  subtotal        DECIMAL(14,2) NOT NULL CHECK (subtotal > 0),
  talla           VARCHAR(60),
  material        VARCHAR(60),
  color_hex       CHAR(7),
  estilo_diseno   VARCHAR(40),
  archivo_diseno  VARCHAR(255),
  notas           VARCHAR(500),
  KEY ix_detalle_pedido (id_pedido),
  FOREIGN KEY (id_pedido)   REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  FOREIGN KEY (id_servicio) REFERENCES servicio_producto(id_servicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS historial_estado_pedido (
  id_historial    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_pedido       INT NOT NULL,
  estado_anterior VARCHAR(15),
  estado_nuevo    VARCHAR(15) NOT NULL,
  id_usuario      INT NULL,
  comentario      VARCHAR(255),
  created_at      DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY ix_historial_pedido (id_pedido, created_at),
  FOREIGN KEY (id_pedido)  REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 6. Pagos ----------
-- Nunca se guarda número de tarjeta completo ni CVV (PCI-DSS): solo marca y últimos 4.
CREATE TABLE IF NOT EXISTS pago (
  id_pago        INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_pedido      INT NOT NULL,
  metodo         VARCHAR(15) NOT NULL CHECK (metodo IN ('PSE','TARJETA','TRANSFERENCIA')),
  estado         VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO','REEMBOLSADO')),
  monto          DECIMAL(14,2) NOT NULL CHECK (monto >= 0),
  moneda         CHAR(3) NOT NULL DEFAULT 'COP',
  pasarela       VARCHAR(30) NOT NULL DEFAULT 'SIMULADA',
  referencia     VARCHAR(60) NOT NULL UNIQUE,
  referencia_pasarela VARCHAR(80),
  marca_tarjeta  VARCHAR(20),
  ultimos4       CHAR(4),
  banco          VARCHAR(80),
  codigo_respuesta VARCHAR(20),
  mensaje        VARCHAR(255),
  fecha_pago     DATETIME(3) NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  -- Máximo un pago APROBADO por pedido
  aprobado_flag  TINYINT GENERATED ALWAYS AS (CASE WHEN estado = 'APROBADO' THEN 1 ELSE NULL END) STORED,
  UNIQUE KEY ux_pago_aprobado (id_pedido, aprobado_flag),
  KEY ix_pago_pedido (id_pedido),
  FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 7. Producción y notificaciones ----------
CREATE TABLE IF NOT EXISTS orden_trabajo (
  id_orden     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  numero_orden VARCHAR(20) NOT NULL DEFAULT '' UNIQUE,       -- lo asigna el trigger trg_orden_numero
  id_pedido    INT NOT NULL UNIQUE,
  id_disenador INT NULL,
  estado       VARCHAR(15) NOT NULL DEFAULT 'EN_COLA'
               CHECK (estado IN ('EN_COLA','EN_DISENO','EN_PRODUCCION','CONTROL_CALIDAD','TERMINADA')),
  prioridad    SMALLINT NOT NULL DEFAULT 2 CHECK (prioridad BETWEEN 1 AND 3),
  notas        VARCHAR(500),
  created_at   DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  updated_at   DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  FOREIGN KEY (id_pedido)    REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  FOREIGN KEY (id_disenador) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NOT NULL,
  id_pedido       INT NULL,
  tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('PEDIDO','PAGO','FACTURA','PRODUCCION','SISTEMA')),
  titulo          VARCHAR(120) NOT NULL,
  mensaje         VARCHAR(500) NOT NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY ix_notif_usuario (id_usuario, leida, created_at),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_pedido)  REFERENCES pedido(id_pedido) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Registro de correos transaccionales (auditoría de envíos)
CREATE TABLE IF NOT EXISTS correo_enviado (
  id_correo    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_usuario   INT NULL,
  id_pedido    INT NULL,
  destinatario VARCHAR(160) NOT NULL,
  plantilla    VARCHAR(40)  NOT NULL,
  asunto       VARCHAR(200) NOT NULL,
  estado       VARCHAR(10)  NOT NULL CHECK (estado IN ('ENVIADO','ERROR','OMITIDO')),
  proveedor    VARCHAR(20)  NOT NULL,
  id_externo   VARCHAR(100),
  error        VARCHAR(500),
  created_at   DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  KEY ix_correo_fecha (created_at),
  KEY ix_correo_pedido (id_pedido),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  FOREIGN KEY (id_pedido)  REFERENCES pedido(id_pedido) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 8. Facturación electrónica ----------
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id                  SMALLINT NOT NULL DEFAULT 1 PRIMARY KEY CHECK (id = 1),
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
  iva_porcentaje      DECIMAL(5,2) NOT NULL DEFAULT 19.00,
  descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  updated_at          DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS resolucion_facturacion (
  id_resolucion  SMALLINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  numero         VARCHAR(30) NOT NULL,
  prefijo        VARCHAR(6)  NOT NULL,
  desde          INT NOT NULL,
  hasta          INT NOT NULL,
  consecutivo_actual INT NOT NULL,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE NOT NULL,
  clave_tecnica  VARCHAR(100) NOT NULL,
  ambiente       CHAR(1) NOT NULL DEFAULT '2' CHECK (ambiente IN ('1','2')),
  activa         BOOLEAN NOT NULL DEFAULT TRUE,
  prefijo_activo VARCHAR(6) GENERATED ALWAYS AS (CASE WHEN activa THEN prefijo ELSE NULL END) STORED,
  UNIQUE KEY ux_resolucion_activa (prefijo_activo),
  CHECK (hasta >= desde AND consecutivo_actual BETWEEN desde - 1 AND hasta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS factura (
  id_factura       INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_pedido        INT NOT NULL UNIQUE,
  id_pago          INT NOT NULL UNIQUE,
  id_resolucion    SMALLINT NOT NULL,
  prefijo          VARCHAR(6) NOT NULL,
  consecutivo      INT NOT NULL,
  numero_factura   VARCHAR(20) NOT NULL UNIQUE,
  cufe             CHAR(96) NOT NULL UNIQUE,
  estado           VARCHAR(12) NOT NULL DEFAULT 'EMITIDA' CHECK (estado IN ('EMITIDA','ACEPTADA','RECHAZADA','ANULADA')),
  ambiente         CHAR(1) NOT NULL DEFAULT '2',
  proveedor        VARCHAR(30) NOT NULL DEFAULT 'SIMULADO',
  fecha_emision    DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  adquirente_nombre VARCHAR(160) NOT NULL,
  adquirente_tipo_documento VARCHAR(5) NOT NULL,
  adquirente_documento VARCHAR(20) NOT NULL,
  adquirente_email VARCHAR(160) NOT NULL,
  adquirente_direccion VARCHAR(200),
  subtotal         DECIMAL(14,2) NOT NULL,
  descuento        DECIMAL(14,2) NOT NULL DEFAULT 0,
  base_gravable    DECIMAL(14,2) NOT NULL,
  iva_porcentaje   DECIMAL(5,2)  NOT NULL,
  iva              DECIMAL(14,2) NOT NULL,
  total            DECIMAL(14,2) NOT NULL,
  xml_ubl          LONGTEXT NOT NULL,
  qr_data          TEXT NOT NULL,
  created_at       DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  UNIQUE KEY ux_factura_resolucion (id_resolucion, consecutivo),
  FOREIGN KEY (id_pedido)     REFERENCES pedido(id_pedido),
  FOREIGN KEY (id_pago)       REFERENCES pago(id_pago),
  FOREIGN KEY (id_resolucion) REFERENCES resolucion_facturacion(id_resolucion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS factura_item (
  id_factura_item INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_factura      INT NOT NULL,
  linea           SMALLINT NOT NULL,
  descripcion     VARCHAR(255) NOT NULL,
  cantidad        INT NOT NULL,
  precio_unitario DECIMAL(14,2) NOT NULL,
  subtotal        DECIMAL(14,2) NOT NULL,
  UNIQUE KEY ux_factura_linea (id_factura, linea),
  FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------- 9. Triggers ----------
DELIMITER $$

DROP TRIGGER IF EXISTS trg_pedido_numero$$
CREATE TRIGGER trg_pedido_numero BEFORE INSERT ON pedido FOR EACH ROW
BEGIN
  DECLARE v INT;
  IF NEW.numero_pedido IS NULL OR NEW.numero_pedido = '' THEN
    UPDATE secuencia SET valor = valor + 1 WHERE nombre = 'pedido';
    SELECT valor INTO v FROM secuencia WHERE nombre = 'pedido';
    SET NEW.numero_pedido = CONCAT('PEDIDO-', v);
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_orden_numero$$
CREATE TRIGGER trg_orden_numero BEFORE INSERT ON orden_trabajo FOR EACH ROW
BEGIN
  DECLARE v INT;
  IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
    UPDATE secuencia SET valor = valor + 1 WHERE nombre = 'orden';
    SELECT valor INTO v FROM secuencia WHERE nombre = 'orden';
    SET NEW.numero_orden = CONCAT('OT-', LPAD(v, 6, '0'));
  END IF;
END$$

-- updated_at siempre en UTC, también para cambios manuales por SQL
DROP TRIGGER IF EXISTS trg_usuario_upd$$
CREATE TRIGGER trg_usuario_upd BEFORE UPDATE ON usuario FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$
DROP TRIGGER IF EXISTS trg_categoria_upd$$
CREATE TRIGGER trg_categoria_upd BEFORE UPDATE ON categoria FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$
DROP TRIGGER IF EXISTS trg_servicio_upd$$
CREATE TRIGGER trg_servicio_upd BEFORE UPDATE ON servicio_producto FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$
DROP TRIGGER IF EXISTS trg_carrito_upd$$
CREATE TRIGGER trg_carrito_upd BEFORE UPDATE ON carrito FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$
DROP TRIGGER IF EXISTS trg_pedido_upd$$
CREATE TRIGGER trg_pedido_upd BEFORE UPDATE ON pedido FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$
DROP TRIGGER IF EXISTS trg_orden_upd$$
CREATE TRIGGER trg_orden_upd BEFORE UPDATE ON orden_trabajo FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$
DROP TRIGGER IF EXISTS trg_empresa_upd$$
CREATE TRIGGER trg_empresa_upd BEFORE UPDATE ON configuracion_empresa FOR EACH ROW SET NEW.updated_at = UTC_TIMESTAMP(3)$$

DELIMITER ;

-- ---------- 10. Vistas ----------
CREATE OR REPLACE VIEW v_historial_pedidos AS
SELECT p.id_pedido, p.numero_pedido, p.id_cliente, p.estado, p.total, p.created_at,
       p.fecha_estimada_entrega, f.numero_factura,
       (SELECT GROUP_CONCAT(d.nombre_item ORDER BY d.id_detalle SEPARATOR ', ')
          FROM detalle_pedido d WHERE d.id_pedido = p.id_pedido) AS items
  FROM pedido p LEFT JOIN factura f ON f.id_pedido = p.id_pedido;

CREATE OR REPLACE VIEW v_ventas_diarias AS
SELECT DATE(pg.fecha_pago) AS dia, COUNT(*) AS pagos, SUM(pg.monto) AS total_vendido
  FROM pago pg WHERE pg.estado = 'APROBADO'
 GROUP BY DATE(pg.fecha_pago) ORDER BY dia DESC;
