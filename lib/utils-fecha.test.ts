import { describe, it, expect } from "vitest";

process.env.TZ = "America/Argentina/Buenos_Aires";

import { parseFechaLocal, formatFechaInput } from "./utils-fecha";

describe("parseFechaLocal", () => {
  it("convierte un string yyyy-MM-dd al mismo día en hora local", () => {
    const fecha = parseFechaLocal("2026-05-28");
    expect(fecha?.getFullYear()).toBe(2026);
    expect(fecha?.getMonth()).toBe(4); // mayo, 0-indexed
    expect(fecha?.getDate()).toBe(28);
  });

  it("devuelve undefined para valores vacíos", () => {
    expect(parseFechaLocal("")).toBeUndefined();
    expect(parseFechaLocal(null)).toBeUndefined();
    expect(parseFechaLocal(undefined)).toBeUndefined();
  });

  it("devuelve el mismo Date si ya es un Date válido", () => {
    const original = new Date(2026, 4, 28);
    expect(parseFechaLocal(original)).toBe(original);
  });

  it("devuelve undefined ante un string no reconocido", () => {
    expect(parseFechaLocal("no-es-una-fecha")).toBeUndefined();
  });
});

describe("formatFechaInput", () => {
  it("formatea un Date a yyyy-MM-dd", () => {
    expect(formatFechaInput(new Date(2026, 4, 5))).toBe("2026-05-05");
  });

  it("devuelve string vacío para valores nulos/indefinidos", () => {
    expect(formatFechaInput(null)).toBe("");
    expect(formatFechaInput(undefined)).toBe("");
  });

  it("es el inverso de parseFechaLocal para fechas yyyy-MM-dd", () => {
    const original = "2026-01-31";
    const parsed = parseFechaLocal(original)!;
    expect(formatFechaInput(parsed)).toBe(original);
  });
});
