// lib/utils-fecha.ts

/**
 * Convierte un string "yyyy-MM-dd" a Date en timezone local (mediodía).
 * Evita el bug de UTC donde "2026-05-28" se convierte a "2026-05-27" en Argentina (UTC-3).
 *
 * Uso en react-hook-form:
 *   {...register("fecha", { setValueAs: parseFechaLocal })}
 */
export function parseFechaLocal(v: unknown): Date | undefined {
  if (!v) return undefined;

  // Si ya es un Date válido, lo devolvemos tal cual
  if (v instanceof Date && !isNaN(v.getTime())) return v;

  // Si es string "yyyy-MM-dd"
  if (typeof v === "string") {
    const parts = v.split("-").map(Number);
    if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
      const [year, month, day] = parts;
      // Mediodía local — nunca hay ambigüedad de día con cualquier offset horario
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }

  return undefined;
}

/**
 * Formatea un Date a "yyyy-MM-dd" para el value de <input type="date">.
 * Usa timezone local, no UTC.
 *
 * Uso: defaultValue={formatFechaInput(transaccion.fecha)}
 */
export function formatFechaInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}