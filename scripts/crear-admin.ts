/**
 * Crea (o actualiza la contraseña de) el primer administrador. Equivale al DataSeeder de pixel-api.
 * Uso:  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:admin
 */
import bcrypt from "bcryptjs";
import { db, igualCI } from "../src/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE?.trim() || "Administrador";
  if (!email || !password) throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno (.env).");
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    throw new Error("ADMIN_PASSWORD debe tener mínimo 8 caracteres, con letras y números.");

  const rol = await db.rol.findUnique({ where: { nombre: "ADMINISTRADOR" } });
  if (!rol) throw new Error("Falta el rol ADMINISTRADOR: ejecuta primero db/02_seed.sql");
  const passwordHash = await bcrypt.hash(password, 10);

  const existente = await db.usuario.findFirst({ where: { email: igualCI(email) } });
  if (existente) {
    await db.usuario.update({ where: { idUsuario: existente.idUsuario }, data: { passwordHash, estado: "ACTIVO" } });
    await db.usuarioRol.upsert({
      where: { idUsuario_idRol: { idUsuario: existente.idUsuario, idRol: rol.idRol } },
      create: { idUsuario: existente.idUsuario, idRol: rol.idRol }, update: {},
    });
    await db.administrador.upsert({ where: { idUsuario: existente.idUsuario }, create: { idUsuario: existente.idUsuario, cargo: "Administrador" }, update: {} });
    console.log(`✔ Usuario existente ${email} actualizado como ADMINISTRADOR (contraseña restablecida).`);
  } else {
    await db.usuario.create({
      data: {
        nombre, email, passwordHash, aceptaTerminosAt: new Date(),
        usuarioRols: { create: { idRol: rol.idRol } },
        administrador: { create: { cargo: "Administrador" } },
      },
    });
    console.log(`✔ Administrador ${email} creado.`);
  }
}

main().catch((e) => { console.error("✖", e.message); process.exit(1); }).finally(() => db.$disconnect());
