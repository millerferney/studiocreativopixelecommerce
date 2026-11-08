import { requerirUsuario } from "@/lib/auth";
import { api, leerJson, ok } from "@/lib/http";
import { crearServicio, listarServicios } from "@/server/services/catalogo";

// Lectura pública (catálogo de la tienda). Escritura solo ADMINISTRADOR.
export const GET = api(async (req) => {
  const sp = new URL(req.url).searchParams;
  const cat = Number(sp.get("categoria"));
  const orden = sp.get("orden");
  return ok(
    await listarServicios({
      idCategoria: Number.isInteger(cat) && cat > 0 ? cat : undefined,
      soloDisponibles: sp.get("disponibles") === "true",
      orden: orden === "asc" || orden === "desc" ? orden : undefined,
      q: sp.get("q")?.slice(0, 80) || undefined,
    }),
  );
});
export const POST = api(async (req) => {
  await requerirUsuario("ADMINISTRADOR");
  return ok(await crearServicio(await leerJson(req)), 201);
});
