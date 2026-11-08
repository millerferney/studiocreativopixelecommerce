/**
 * Ejecuta db/01_schema.sql garantizando codificación UTF-8 en todas las plataformas (Windows / Mac / Linux).
 * Uso: npm run db:schema
 */
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("No se encontró DIRECT_URL ni DATABASE_URL en el archivo .env");
  }

  console.log("Conectando a la base de datos de Supabase...");
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("✔ Conectado a PostgreSQL.");

  const sqlPath = join(process.cwd(), "db", "01_schema.sql");
  const sql = readFileSync(sqlPath, "utf-8");

  console.log("Ejecutando db/01_schema.sql con codificación UTF-8...");
  await client.query(sql);

  console.log("✔ db/01_schema.sql ejecutado con éxito.");
  await client.end();
}

main().catch((err) => {
  console.error("✖ Error al ejecutar el esquema:", err.message || err);
  process.exit(1);
});

