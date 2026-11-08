import { defineConfig } from "prisma/config";

// El motor se deduce de la cadena de conexión (mysql://... o postgresql://...). Se puede forzar con DB_PROVIDER.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://pixel:pixel@localhost:5432/pixel_test";
const proveedor = process.env.DB_PROVIDER ?? (/^mysql/i.test(url) ? "mysql" : "postgres");

export default defineConfig({
  schema: proveedor === "mysql" ? "prisma/schema.mysql.prisma" : "prisma/schema.postgres.prisma",
  datasource: { url },
});
