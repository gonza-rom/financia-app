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

    const [mesActual, mesAnterior, todoElTiempo, cobrarDeudas, pagarDeudas, saldoCuentas] =
      await Promise.all([
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
        // Deudas que te deben — CON y SIN cuotas (todo suma)
        prisma.deuda.findMany({
          where: {
            usuarioId,
            tipo: "COBRAR",
            estado: { in: ["PENDIENTE", "VENCIDA"] },
            // ← sin filtro de cuotas
          },
          select: { montoTotal: true, montoPagado: true },
        }),
        // Deudas que debés — SIN cuotas solamente
        prisma.deuda.findMany({
          where: {
            usuarioId,
            tipo: "PAGAR",
            estado: { in: ["PENDIENTE", "VENCIDA"] },
            cuotas: { none: {} }, // ← solo excluir las que vos debés en cuotas
          },
          select: { montoTotal: true, montoPagado: true },
        }),
        // Saldo real de todas las cuentas activas
        prisma.cuenta.aggregate({
          where: { usuarioId, activo: true },
          _sum: { saldo: true },
        }),
      ]);

    const getMonto = (
      data: { tipo: TipoTransaccion; _sum: { monto: unknown } }[],
      tipo: TipoTransaccion
    ) => Number(data.find((r) => r.tipo === tipo)?._sum.monto ?? 0);

    const sumarSaldo = (deudas: { montoTotal: unknown; montoPagado: unknown }[]) =>
      deudas.reduce((acc, d) => acc + (Number(d.montoTotal) - Number(d.montoPagado)), 0);

    const ingresoMensual  = getMonto(mesActual, TipoTransaccion.INGRESO);
    const gastoMensual    = getMonto(mesActual, TipoTransaccion.GASTO);
    const ingresoAnterior = getMonto(mesAnterior, TipoTransaccion.INGRESO);
    const gastoAnterior   = getMonto(mesAnterior, TipoTransaccion.GASTO);
    const ingresoTotal    = getMonto(todoElTiempo, TipoTransaccion.INGRESO);
    const gastoTotal      = getMonto(todoElTiempo, TipoTransaccion.GASTO);

    const porCobrarPendiente = sumarSaldo(cobrarDeudas);
    const porPagarPendiente  = sumarSaldo(pagarDeudas);

    const flujoNetoHistorico = ingresoTotal - gastoTotal;
    const ahorroMensual = ingresoMensual - gastoMensual;
    const tasaAhorro = ingresoMensual > 0 ? (ahorroMensual / ingresoMensual) * 100 : 0;

    const saldoTotalCuentas = Number(saldoCuentas._sum.saldo ?? 0);
    const patrimonioNeto = saldoTotalCuentas + porCobrarPendiente - porPagarPendiente;

    return {
      balanceTotal: flujoNetoHistorico,
      patrimonioNeto,
      saldoTotalCuentas,
      porCobrarPendiente,
      porPagarPendiente,
      ingresoMensual,
      gastoMensual,
      ahorroMensual,
      cambioIngreso: calculatePercentageChange(ingresoMensual, ingresoAnterior),
      cambioGasto: calculatePercentageChange(gastoMensual, gastoAnterior),
      tasaAhorro,
    };
  },
  ["dashboard-stats"],
  { revalidate: 30, tags: ["transacciones", "dashboard-stats", "deudas", "cuentas"] }
);