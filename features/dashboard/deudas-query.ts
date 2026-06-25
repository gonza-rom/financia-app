// features/dashboard/deudas-query.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getCachedResumenDeudas = unstable_cache(
  async (usuarioId: string) => {
    const [cobrar, pagar, cobrarCuotas, pagarCuotas] = await Promise.all([
      prisma.deuda.findMany({
        where: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] }, tipo: "COBRAR" },
        select: { montoTotal: true, montoPagado: true, cuotas: { select: { id: true } } },
      }),
      prisma.deuda.findMany({
        where: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] }, tipo: "PAGAR" },
        select: { montoTotal: true, montoPagado: true, cuotas: { select: { id: true } } },
      }),
      // cuotas pendientes este mes — cobrar
      prisma.cuotaDeuda.findMany({
        where: {
          pagada: false,
          deuda: { usuarioId, tipo: "COBRAR", estado: { in: ["PENDIENTE", "VENCIDA"] } },
        },
        select: { monto: true },
      }),
      // cuotas pendientes este mes — pagar
      prisma.cuotaDeuda.findMany({
        where: {
          pagada: false,
          deuda: { usuarioId, tipo: "PAGAR", estado: { in: ["PENDIENTE", "VENCIDA"] } },
        },
        select: { monto: true },
      }),
    ]);

    const sinCuotas = (d: { montoTotal: unknown; montoPagado: unknown; cuotas: unknown[] }) =>
      d.cuotas.length === 0;
    const conCuotas = (d: { montoTotal: unknown; montoPagado: unknown; cuotas: unknown[] }) =>
      d.cuotas.length > 0;
    const sumarSaldo = (deudas: { montoTotal: unknown; montoPagado: unknown }[]) =>
      deudas.reduce((acc, d) => acc + (Number(d.montoTotal) - Number(d.montoPagado)), 0);

    return {
      porCobrar: sumarSaldo(cobrar.filter(sinCuotas)),
      porPagar: sumarSaldo(pagar.filter(sinCuotas)),
      cantidadCobrar: cobrar.filter(sinCuotas).length,
      cantidadPagar: pagar.filter(sinCuotas).length,
      cuotasCobrar: sumarSaldo(cobrar.filter(conCuotas)),
      cuotasPagar: sumarSaldo(pagar.filter(conCuotas)),
      cantidadCuotasCobrar: cobrar.filter(conCuotas).length,
      cantidadCuotasPagar: pagar.filter(conCuotas).length,
    };
  },
  ["resumen-deudas"],
  { revalidate: 60, tags: ["deudas"] }
);