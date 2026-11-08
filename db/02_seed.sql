-- =====================================================================
-- Studio Creativo Pixel — Datos iniciales (catálogo de la web + parámetros)
-- Ejecutar DESPUÉS de 01_schema.sql. Es re-ejecutable (ON CONFLICT DO NOTHING).
-- El primer administrador NO se crea aquí (no se guardan contraseñas en SQL):
--   usar  npm run db:admin  (lee ADMIN_EMAIL / ADMIN_PASSWORD del entorno).
-- =====================================================================

INSERT INTO rol (nombre, descripcion) VALUES
  ('CLIENTE',       'Compra en la tienda y consulta sus pedidos y facturas'),
  ('ADMINISTRADOR', 'Gestiona catálogo, usuarios, pedidos, pagos y facturas'),
  ('DISENADOR',     'Atiende las órdenes de trabajo de producción')
ON CONFLICT (nombre) DO NOTHING;

-- Categorías (select del catálogo: Tazas y Mugs / Ropa y Textiles / Accesorios)
INSERT INTO categoria (nombre, descripcion) VALUES
  ('Tazas',      'Tazas, mugs y vasos personalizados por sublimación'),
  ('Ropa',       'Ropa y textiles con sublimación de alta definición'),
  ('Accesorios', 'Carcasas, gorras, llaveros y botellas personalizadas')
ON CONFLICT (nombre) DO NOTHING;

-- Productos (los 8 del catálogo + Gorra Vector-Core de la página Servicios)
INSERT INTO servicio_producto (nombre, descripcion, precio, tiempo_entrega, estado, tipo, imagen_url, badge, destacado, id_categoria)
SELECT v.nombre, v.descripcion, v.precio, v.dias, 'DISPONIBLE', 'PRODUCTO', v.img, v.badge, v.destacado,
       (SELECT id_categoria FROM categoria WHERE nombre = v.cat)
FROM (VALUES
  (1, 'Taza Esmerilada',     'Taza con acabado esmerilado para sublimación a todo color.',                         25000,  3, '/assets/productos/taza-esmerilada.jpg',     'OFERTA', false, 'Tazas'),
  (2, 'Gorra Snapback',      'Gorra snapback con panel frontal personalizable.',                                    35000,  4, '/assets/productos/gorra-snapback.png',      NULL,     false, 'Accesorios'),
  (3, 'Taza Pixel-Glow',     'Cerámica de alta calidad con recubrimiento especial para máxima retención de color.', 38000,  3, '/assets/productos/taza-pixel-glow.jpg',     NULL,     true,  'Tazas'),
  (4, 'Hoodie Tech-Spec',    'Poliéster técnico diseñado para aguantar lavadas y sublimación sin pérdida de detalle.', 95000, 5, '/assets/productos/hoodie-tech-spec.webp',  'NUEVO',  true,  'Ropa'),
  (5, 'Carcasa iPhone 14',   'Carcasa protectora con impresión sublimada de alta resolución.',                      42000,  4, '/assets/productos/carcasa-iphone-14.jpg',   NULL,     false, 'Accesorios'),
  (6, 'Vaso Stanley Custom', 'Vaso térmico de acero inoxidable con diseño personalizado.',                          120000, 5, '/assets/productos/vaso-stanley-custom.jpg', 'PRO',    false, 'Tazas'),
  (7, 'Llavero Acrílico',    'Llavero de acrílico con impresión a doble cara.',                                      8000,  2, '/assets/productos/llavero-acrilico.jpg',    NULL,     false, 'Accesorios'),
  (8, 'Botella Aluminio',    'Botella de aluminio ligera con acabado personalizado.',                               28000,  3, '/assets/productos/botella-aluminio.jpg',    NULL,     false, 'Accesorios'),
  (9, 'Gorra Vector-Core',   'Panel frontal 100% personalizable. Colores resistentes al sol y lavados.',            25000,  4, '/assets/productos/gorra-snapback.png',      NULL,     true,  'Accesorios')
) AS v(ord, nombre, descripcion, precio, dias, img, badge, destacado, cat)
WHERE NOT EXISTS (SELECT 1 FROM servicio_producto s WHERE s.nombre = v.nombre)
ORDER BY v.ord;  -- orden fijo => ids estables (1 = Taza Esmerilada ... 9 = Gorra Vector-Core)

-- Opciones de personalización (tallas y materiales)
INSERT INTO opcion_producto (id_servicio, tipo, valor, orden)
SELECT s.id_servicio, o.tipo, o.valor, o.orden
FROM (VALUES
  ('Taza Esmerilada','TALLA','11oz',1),('Taza Esmerilada','TALLA','15oz',2),
  ('Taza Esmerilada','MATERIAL','Esmerilado',1),('Taza Esmerilada','MATERIAL','Brillante',2),('Taza Esmerilada','MATERIAL','Mate',3),
  ('Gorra Snapback','TALLA','S/M',1),('Gorra Snapback','TALLA','L/XL',2),
  ('Gorra Snapback','MATERIAL','Algodón 100%',1),('Gorra Snapback','MATERIAL','Poliéster',2),('Gorra Snapback','MATERIAL','Gabardina',3),
  ('Taza Pixel-Glow','TALLA','11oz',1),('Taza Pixel-Glow','TALLA','15oz',2),('Taza Pixel-Glow','TALLA','20oz',3),
  ('Taza Pixel-Glow','MATERIAL','Glow UV',1),('Taza Pixel-Glow','MATERIAL','Esmerilado',2),('Taza Pixel-Glow','MATERIAL','Brillante',3),
  ('Hoodie Tech-Spec','TALLA','XS',1),('Hoodie Tech-Spec','TALLA','S',2),('Hoodie Tech-Spec','TALLA','M',3),
  ('Hoodie Tech-Spec','TALLA','L',4),('Hoodie Tech-Spec','TALLA','XL',5),('Hoodie Tech-Spec','TALLA','XXL',6),
  ('Hoodie Tech-Spec','MATERIAL','Fleece',1),('Hoodie Tech-Spec','MATERIAL','French Terry',2),('Hoodie Tech-Spec','MATERIAL','Oversize',3),
  ('Carcasa iPhone 14','TALLA','iPhone 14',1),('Carcasa iPhone 14','TALLA','iPhone 14 Pro',2),('Carcasa iPhone 14','TALLA','iPhone 14 Plus',3),
  ('Carcasa iPhone 14','MATERIAL','Silicona',1),('Carcasa iPhone 14','MATERIAL','Acrílico',2),('Carcasa iPhone 14','MATERIAL','TPU',3),
  ('Vaso Stanley Custom','TALLA','20oz',1),('Vaso Stanley Custom','TALLA','30oz',2),('Vaso Stanley Custom','TALLA','40oz',3),
  ('Vaso Stanley Custom','MATERIAL','Acero Inox',1),('Vaso Stanley Custom','MATERIAL','Matte',2),('Vaso Stanley Custom','MATERIAL','Chrome',3),
  ('Llavero Acrílico','TALLA','5cm',1),('Llavero Acrílico','TALLA','7cm',2),('Llavero Acrílico','TALLA','10cm',3),
  ('Llavero Acrílico','MATERIAL','Acrílico Claro',1),('Llavero Acrílico','MATERIAL','Acrílico Blanco',2),('Llavero Acrílico','MATERIAL','Espejo',3),
  ('Botella Aluminio','TALLA','500ml',1),('Botella Aluminio','TALLA','750ml',2),('Botella Aluminio','TALLA','1L',3),
  ('Botella Aluminio','MATERIAL','Aluminio',1),('Botella Aluminio','MATERIAL','Mate',2),('Botella Aluminio','MATERIAL','Anodizado',3),
  ('Gorra Vector-Core','TALLA','S/M',1),('Gorra Vector-Core','TALLA','L/XL',2),
  ('Gorra Vector-Core','MATERIAL','Algodón 100%',1),('Gorra Vector-Core','MATERIAL','Poliéster',2)
) AS o(producto, tipo, valor, orden)
JOIN servicio_producto s ON s.nombre = o.producto
ON CONFLICT (id_servicio, tipo, valor) DO NOTHING;

INSERT INTO color_paleta (nombre, hex, orden) VALUES
  ('Blanco','#FFFFFF',1),('Negro','#000000',2),('Rosa Neon','#FF2D78',3),('Cyan','#00E5FF',4),
  ('Verde Neon','#00FF00',5),('Púrpura','#7C3AED',6),('Naranja','#FF6B00',7),('Dorado','#FFD700',8),
  ('Rojo','#FF0000',9),('Azul Marino','#1A237E',10),('Verde Oscuro','#004D40',11),('Gris Acero','#37474F',12)
ON CONFLICT DO NOTHING;

INSERT INTO estilo_diseno (codigo, etiqueta, descripcion, icono, orden) VALUES
  ('minimal',   'Minimalista', 'Limpio y simple',          '◻', 1),
  ('gradient',  'Degradado',   'Colores en transición',    '🌈', 2),
  ('geometric', 'Geométrico',  'Formas y patrones',        '◆', 3),
  ('neon',      'Neon Glow',   'Brillos neón',             '✦', 4),
  ('retro',     'Retro',       'Estilo vintage',           '◉', 5),
  ('custom',    'Tu archivo',  'Diseño propio',            '📁', 6)
ON CONFLICT (codigo) DO NOTHING;

-- Emisor de facturas. >>> REEMPLAZAR por los datos reales del RUT antes de producción <<<
INSERT INTO configuracion_empresa
  (id, razon_social, nit, digito_verificacion, direccion, ciudad, departamento, codigo_municipio, telefono, email)
VALUES
  (1, 'Studio Creativo Pixel S.A.S.', '900000000', '0', 'Dirección por configurar', 'Bogotá D.C.', 'Bogotá D.C.', '11001', '+57 300 000 0000', 'facturacion@studiocreativopixel.example')
ON CONFLICT (id) DO NOTHING;

-- Resolución de PRUEBAS (ambiente 2 / habilitación). En producción: cargar la resolución
-- real otorgada por la DIAN (número, prefijo, rango, vigencia y clave técnica).
INSERT INTO resolucion_facturacion
  (numero, prefijo, desde, hasta, consecutivo_actual, fecha_inicio, fecha_fin, clave_tecnica, ambiente, activa)
SELECT '18760000001', 'SETP', 990000000, 995000000, 989999999, DATE '2026-01-01', DATE '2030-12-31',
       'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c', '2', TRUE
WHERE NOT EXISTS (SELECT 1 FROM resolucion_facturacion WHERE prefijo = 'SETP');
