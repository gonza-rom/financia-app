// features/dashboard/queries.ts
import { prisma } from "@/lib/prisma";
import type { EstadisticasDashboard } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { getMonthRange, getPreviousMonthRange, calculatePercentageChange } from "@/lib/utils";

export const getCachedDashboardStats = unstable_cache(
  async (usuarioId: string): Promise<EstadisticasDashboard> => {
    const ahora = new Date();
    const { from: desdeActual, to: hastaActual } = getMonthRange(ahora);
    const { from: desdeAnterior, to: hastaAnterior } = getPreviousMonthRange(ahora);

    const [mesActual, mesAnterior, todoElTiempo] = await Promise.all([
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId, fecha: { gte: desdeActual, lte: hastaActual } },
        _sum: { monto: true },
      }),
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId, fecha: { gte: desdeAnterior, lte: hastaAnterior } },
        _sum: { monto: true },
      }),
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId },
        _sum: { monto: true },
      }),
    ]);

    const getMonto = (
      data: { tipo: TipoTransaccion; _sum: { monto: unknown } }[],
      tipo: TipoTransaccion
    ) => Number(data.find((r) => r.tipo === tipo)?._sum.monto ?? 0);

    const ingresoMensual = getMonto(mesActual, TipoTransaccion.INGRESO);
    const gastoMensual = getMonto(mesActual, TipoTransaccion.GASTO);
    const ingresoAnterior = getMonto(mesAnterior, TipoTransaccion.INGRESO);
    const gastoAnterior = getMonto(mesAnterior, TipoTransaccion.GASTO);
    const ingresoTotal = getMonto(todoElTiempo, TipoTransaccion.INGRESO);
    const gastoTotal = getMonto(todoElTiempo, TipoTransaccion.GASTO);

    const ahorroMensual = ingresoMensual - gastoMensual;
    const tasaAhorro = ingresoMensual > 0 ? (ahorroMensual / ingresoMensual) * 100 : 0;

    return {
      balanceTotal: ingresoTotal - gastoTotal,
      ingresoMensual,
      gastoMensual,
      ahorroMensual,
      cambioIngreso: calculatePercentageChange(ingresoMensual, ingresoAnterior),
      cambioGasto: calculatePercentageChange(gastoMensual, gastoAnterior),
      tasaAhorro,
    };
  },
  ["dashboard-stats"],
  { revalidate: 60, tags: ["transacciones"] }
);