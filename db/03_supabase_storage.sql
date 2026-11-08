-- =====================================================================
-- Solo Supabase: bucket PRIVADO para los archivos de diseño que sube el cliente.
-- Ejecutar en el SQL Editor de Supabase (no existe en un Postgres local).
-- La app sube/descarga con SUPABASE_SERVICE_ROLE_KEY desde el servidor; sin políticas
-- públicas, nadie puede leer los archivos con la anon key.
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('disenos', 'disenos', false, 10485760,
        ARRAY['image/png','image/jpeg','image/svg+xml','application/pdf','application/postscript','application/illustrator','image/vnd.adobe.photoshop','application/octet-stream'])
ON CONFLICT (id) DO NOTHING;
