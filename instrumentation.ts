// Fija el timezone del proceso a Argentina para que los cálculos de
// "hoy" / "este mes" en el servidor (dashboard, estadísticas) coincidan
// con la hora local del usuario en vez de depender del TZ del host (UTC en Vercel).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.env.TZ = "America/Argentina/Buenos_Aires";
  }
}
