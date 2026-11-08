import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularTotales, sumarDiasHabiles } from "../../lib/money";
import { calcularCufe } from "../invoicing/cufe";

test("totales: misma regla del prototipo (5% desc, 19% IVA sobre el neto)", () => {
  // 2 × 25.000 + 95.000 = 145.000 → desc 7.250 → base 137.750 → IVA 26.173 → total 163.923
  assert.deepEqual(calcularTotales(145000), { subtotal: 145000, descuento: 7250, iva: 26173, total: 163923 });
  assert.deepEqual(calcularTotales(0), { subtotal: 0, descuento: 0, iva: 0, total: 0 });
});

test("días hábiles: no cuenta sábados ni domingos", () => {
  const viernes = new Date(2026, 10, 6); // 6-nov-2026
  assert.equal(sumarDiasHabiles(viernes, 1).getDay(), 1); // lunes
  assert.equal(sumarDiasHabiles(viernes, 5).getDay(), 5); // viernes siguiente
});

test("CUFE: SHA-384 hex (96 caracteres), determinista y sensible a los datos", () => {
  const base = { numeroFactura: "SETP990000001", fecha: "2026-11-04", hora: "10:00:00-05:00", valorFactura: 114000, iva: 21660, total: 135660, nitEmisor: "900000000", numeroAdquirente: "1012345678", claveTecnica: "clave", ambiente: "2" as const };
  const a = calcularCufe(base);
  assert.match(a, /^[0-9a-f]{96}$/);
  assert.equal(a, calcularCufe({ ...base }));
  assert.notEqual(a, calcularCufe({ ...base, total: 135661 }));
});
