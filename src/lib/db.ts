import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * La app corre igual sobre PostgreSQL (Supabase) o MySQL 8. El motor se deduce de DATABASE_URL:
 *   postgresql://...  → adapter pg        mysql://...  → adapter MariaDB/MySQL
 * `prisma generate` debe correr con la misma URL (ver prisma.config.ts).
 */
const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
export const esMySQL = (process.env.DB_PROVIDER ?? "") === "mysql" || /^mysql/i.test(url);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente() {
  if (!url) throw new Error("Falta DATABASE_URL en las variables de entorno");
  const esLocal = /@(localhost|127\.0\.0\.1)/.test(url);
  const max = process.env.VERCEL ? 3 : 10;

  if (esMySQL) {
    const u = new URL(url);
    const ssl = u.searchParams.get("ssl") === "true" || (!esLocal && u.searchParams.get("ssl") !== "false");
    const adapter = new PrismaMariaDb({
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
      connectionLimit: max,
      timezone: "Z", // las columnas DATETIME se guardan en UTC
      // MySQL 8 usa caching_sha2_password: sin TLS el conector necesita pedir la clave pública (solo para desarrollo local).
      ...(ssl ? { ssl: { rejectUnauthorized: u.searchParams.get("sslaccept") !== "accept_invalid_certs" } } : { allowPublicKeyRetrieval: true }),
    });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({
    connectionString: url,
    // Supabase exige TLS; en local no. El pooler (Supavisor, puerto 6543) multiplexa las conexiones.
    ssl: esLocal ? undefined : { rejectUnauthorized: false },
    max,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? crearCliente();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/** Igualdad sin distinguir mayúsculas. MySQL ya lo hace por collation (_ci); PostgreSQL necesita mode: "insensitive". */
export const igualCI = (v: string) => (esMySQL ? { equals: v } : { equals: v, mode: "insensitive" }) as { equals: string };
export const contieneCI = (v: string) => (esMySQL ? { contains: v } : { contains: v, mode: "insensitive" }) as { contains: string };
