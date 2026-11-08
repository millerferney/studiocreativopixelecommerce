import { db } from "../src/lib/db";

async function main() {
  console.log("=== CATEGORIAS ===");
  const cats = await db.categoria.findMany();
  for (const c of cats) {
    console.log(`[${c.idCategoria}] ${c.nombre}: ${c.descripcion}`);
  }

  console.log("\n=== PRODUCTOS ===");
  const prods = await db.servicioProducto.findMany({
    select: { idServicio: true, nombre: true, descripcion: true },
  });
  for (const p of prods) {
    console.log(`[${p.idServicio}] ${p.nombre}: ${p.descripcion}`);
  }

  console.log("\n=== ESTILOS ===");
  const estilos = await db.estiloDiseno.findMany();
  for (const e of estilos) {
    console.log(`[${e.codigo}] ${e.etiqueta}: ${e.descripcion} (icono: ${e.icono})`);
  }

  console.log("\n=== COLOR PALETA ===");
  const morado = await db.colorPaleta.findUnique({ where: { hex: "#7C3AED" } });
  console.log("Hex #7C3AED:", morado?.nombre);

  console.log("\n=== OPCIONES CON CARACTERES ESPECIALES ===");
  const opciones = await db.opcionProducto.findMany({
    where: {
      OR: [
        { valor: { contains: "Algod" } },
        { valor: { contains: "Poli" } },
        { valor: { contains: "Acr" } },
      ],
    },
  });
  for (const o of opciones.slice(0, 8)) {
    console.log(`Prod ${o.idServicio} (${o.tipo}): ${o.valor}`);
  }

  console.log("\n=== CONFIGURACION EMPRESA ===");
  const emp = await db.configuracionEmpresa.findFirst();
  console.log(`${emp?.razonSocial} | ${emp?.direccion} | ${emp?.ciudad}`);
}

main().catch(console.error).finally(() => db.$disconnect());

