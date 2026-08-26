export const MONEDAS = [
  { value: "ARS", label: "ARS — Peso Argentino" },
  { value: "USD", label: "USD — Dólar Estadounidense" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "BRL", label: "BRL — Real Brasileño" },
  { value: "CLP", label: "CLP — Peso Chileno" },
  { value: "MXN", label: "MXN — Peso Mexicano" },
  { value: "COP", label: "COP — Peso Colombiano" },
  { value: "UYU", label: "UYU — Peso Uruguayo" },
  { value: "GBP", label: "GBP — Libra Esterlina" },
  { value: "JPY", label: "JPY — Yen Japonés" },
] as const;

export const CODIGOS_MONEDA = MONEDAS.map((m) => m.value);

export type CodigoMoneda = (typeof MONEDAS)[number]["value"];
