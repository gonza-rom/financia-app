import { describe, it, expect } from "vitest";
import { generarCuotas } from "./cuotas";

describe("generarCuotas", () => {
  it("genera la cantidad de cuotas pedida", () => {
    const cuotas = generarCuotas(1000, 3, new Date(2026, 0, 15));
    expect(cuotas).toHaveLength(3);
  });

  it("la suma de las cuotas da exacto el monto total, incluso con divisiones que no cierran", () => {
    // 100 / 3 = 33.33... — sin ajuste, 3 cuotas de 33.33 suman 99.99, no 100.
    const cuotas = generarCuotas(100, 3, new Date(2026, 0, 1));
    const suma = cuotas.reduce((acc, c) => acc + c.monto, 0);
    expect(Math.round(suma * 100) / 100).toBe(100);
  });

  it("numera las cuotas en orden a partir de 1", () => {
    const cuotas = generarCuotas(500, 4, new Date(2026, 0, 1));
    expect(cuotas.map((c) => c.numero)).toEqual([1, 2, 3, 4]);
  });

  it("respeta el mismo día del mes en cada cuota cuando el mes lo permite", () => {
    const cuotas = generarCuotas(300, 3, new Date(2026, 0, 15)); // 15 de enero
    expect(cuotas.map((c) => c.fechaVencimiento.getDate())).toEqual([15, 15, 15]);
  });

  it("ajusta al último día del mes cuando el día base no existe (ej. 31 en febrero)", () => {
    const cuotas = generarCuotas(200, 2, new Date(2026, 0, 31)); // 31 de enero
    // Febrero 2026 tiene 28 días
    expect(cuotas[1].fechaVencimiento.getDate()).toBe(28);
    expect(cuotas[1].fechaVencimiento.getMonth()).toBe(1); // febrero (0-indexed)
  });

  it("la primera cuota vence en el mes elegido, no en el siguiente", () => {
    const cuotas = generarCuotas(300, 3, new Date(2026, 2, 10)); // 10 de marzo
    expect(cuotas[0].fechaVencimiento.getMonth()).toBe(2); // marzo
  });
});
