// features/dashboard/daily-chart-query.ts
import { prisma } from "@/lib/prisma";
import { TipoTransaccion } from "@prisma/client";
import { unstable_cache } from "next/cache";

export interface DatoDiario {
  dia: number;       // 1-31
  label: string;     // "1", "2", ... "31"
  ingreso: number;
  gasto: number;
  neto: number;
}

export interface ResumenSemanal {
  ingresoEstaSemana: number;
  gastoEstaSemana: number;
  ingresoSemanaAnterior: number;
  gastoSemanaAnterior: number;
  cambioIngreso: number;
  cambioGasto: number;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const getCachedDailyStats = unstable_cache(
  async (usuarioId: string): Promise<{ dias: DatoDiario[]; semana: ResumenSemanal }> => {
    const ahora = new Date();
    const anio  = ahora.getFullYear();
    const mes   = ahora.getMonth();

    const desde = new Date(anio, mes, 1);
    const hasta = new Date(anio, mes + 1, 0, 23, 59, 59);

    // ─── Datos por día del mes actual ────────────────────────────────────────
    const rows = await prisma.$queryRaw<{ dia: number; tipo: string; total: number }[]>`
      SELECT
        EXTRACT(DAY FROM fecha)::int AS dia,
        tipo,
        SUM(monto)::float             AS total
      FROM transacciones
      WHERE usuario_id = ${usuarioId}
        AND fecha >= ${desde}
        AND fecha <= ${hasta}
      GROUP BY dia, tipo
      ORDER BY dia
    `;

    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const hoyDia    = ahora.getDate();

    const dias: DatoDiario[] = Array.from({ length: hoyDia }, (_, i) => {
      const dia = i + 1;
      const ing = rows.find((r) => r.dia === dia && r.tipo === "INGRESO")?.total ?? 0;
      const gas = rows.find((r) => r.dia === dia && r.tipo === "GASTO")?.total ?? 0;
      return { dia, label: String(dia), ingreso: ing, gasto: gas, neto: ing - gas };
    });

    // ─── Semana actual vs anterior ────────────────────────────────────────────
    const hoy       = startOfDay(ahora);
    const diaSemana = hoy.getDay(); // 0=dom … 6=sab
    const lunesActual  = new Date(hoy); lunesActual.setDate(hoy.getDate() - ((diaSemana + 6) % 7));
    const lunesAnterior = new Date(lunesActual); lunesAnterior.setDate(lunesActual.getDate() - 7);
    const domingoAnterior = new Date(lunesActual); domingoAnterior.setDate(lunesActual.getDate() - 1);
    domingoAnterior.setHours(23, 59, 59);

    const semanas = await Promise.all([
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId, fecha: { gte: lunesActual, lte: ahora } },
        _sum: { monto: true },
      }),
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId, fecha: { gte: lunesAnterior, lte: domingoAnterior } },
        _sum: { monto: true },
      }),
    ]);

    const getS = (data: { tipo: string; _sum: { monto: unknown } }[], tipo: string) =>
      Number(data.find((r) => r.tipo === tipo)?._sum.monto ?? 0);

    const ingresoEstaSemana     = getS(semanas[0], "INGRESO");
    const gastoEstaSemana       = getS(semanas[0], "GASTO");
    const ingresoSemanaAnterior = getS(semanas[1], "INGRESO");
    const gastoSemanaAnterior   = getS(semanas[1], "GASTO");

    function cambio(actual: number, anterior: number) {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return ((actual - anterior) / anterior) * 100;
    }

    return {
      dias,
      semana: {
        ingresoEstaSemana,
        gastoEstaSemana,
        ingresoSemanaAnterior,
        gastoSemanaAnterior,
        cambioIngreso: cambio(ingresoEstaSemana, ingresoSemanaAnterior),
        cambioGasto:   cambio(gastoEstaSemana,   gastoSemanaAnterior),
      },
    };
  },
  ["daily-stats"],
  { revalidate: 60, tags: ["transacciones"] }
);