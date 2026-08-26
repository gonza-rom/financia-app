import { describe, it, expect } from "vitest";

// Fijamos el TZ del proceso de test para que el test de formatDate/formatShortDate
// (que existe justo para detectar el bug de día-de-más/menos por UTC) sea determinista
// sin importar en qué timezone corra la máquina que ejecuta los tests.
process.env.TZ = "America/Argentina/Buenos_Aires";

import {
  getMonthRange, getPreviousMonthRange, calculatePercentageChange,
  getInitials, slugify, formatDate, formatShortDate,
} from "./utils";

describe("getMonthRange", () => {
  it("cubre desde el día 1 hasta el último día del mes, inclusive", () => {
    const { from, to } = getMonthRange(new Date(2026, 1, 15)); // febrero 2026
    expect(from.getDate()).toBe(1);
    expect(from.getMonth()).toBe(1);
    expect(to.getDate()).toBe(28); // 2026 no es bisiesto
    expect(to.getMonth()).toBe(1);
    expect(to.getHours()).toBe(23);
  });

  it("funciona en diciembre sin desbordar al año siguiente", () => {
    const { from, to } = getMonthRange(new Date(2026, 11, 10));
    expect(from.getMonth()).toBe(11);
    expect(to.getMonth()).toBe(11);
    expect(to.getFullYear()).toBe(2026);
  });
});

describe("getPreviousMonthRange", () => {
  it("retrocede correctamente de enero a diciembre del año anterior", () => {
    const { from, to } = getPreviousMonthRange(new Date(2026, 0, 15));
    expect(from.getMonth()).toBe(11);
    expect(from.getFullYear()).toBe(2025);
    expect(to.getMonth()).toBe(11);
    expect(to.getFullYear()).toBe(2025);
  });

  it("retrocede correctamente dentro del mismo año", () => {
    const { from, to } = getPreviousMonthRange(new Date(2026, 5, 15)); // junio -> mayo
    expect(from.getMonth()).toBe(4);
    expect(to.getMonth()).toBe(4);
    expect(from.getFullYear()).toBe(2026);
  });
});

describe("calculatePercentageChange", () => {
  it("calcula el cambio porcentual normal", () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
    expect(calculatePercentageChange(50, 100)).toBe(-50);
  });

  it("no divide por cero cuando el valor anterior es 0", () => {
    expect(calculatePercentageChange(100, 0)).toBe(100);
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });
});

describe("getInitials", () => {
  it("toma la primera letra de hasta dos palabras", () => {
    expect(getInitials("Juan Pérez")).toBe("JP");
    expect(getInitials("Juan Pérez García")).toBe("JP");
  });

  it("funciona con un solo nombre", () => {
    expect(getInitials("Juan")).toBe("J");
  });
});

describe("slugify", () => {
  it("reemplaza espacios por guiones y pasa a minúscula", () => {
    expect(slugify("Hola Mundo")).toBe("hola-mundo");
  });

  it("elimina caracteres que no son palabra ni guion", () => {
    // Nota: \w no incluye letras acentuadas, así que "é" también se elimina.
    // slugify no está en uso actualmente en la app — este test documenta el
    // comportamiento real, no necesariamente el deseado si algún día se usa.
    expect(slugify("Café & Bar!!")).toBe("caf--bar");
  });
});

describe("formatDate / formatShortDate — anclaje a fecha local", () => {
  it("no corre un día para atrás con un string yyyy-MM-dd (bug clásico de UTC)", () => {
    // Sin el fix, new Date("2026-05-28") se interpreta como medianoche UTC,
    // que en Argentina (UTC-3) cae el 27 de mayo.
    const resultado = formatShortDate("2026-05-28");
    expect(resultado).toContain("28");
  });

  it("acepta un objeto Date directamente", () => {
    const resultado = formatShortDate(new Date(2026, 4, 28, 12, 0, 0));
    expect(resultado).toContain("28");
  });

  it("formatDate tampoco corre de día con un string yyyy-MM-dd", () => {
    expect(formatDate("2026-05-28")).toContain("28");
  });
});
