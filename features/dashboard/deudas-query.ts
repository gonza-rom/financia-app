// features/dashboard/deudas-query.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getProximoCierre } from "@/lib/utils";

export const getCachedResumenDeudas = unstable_cache(
  async (usuarioId: string, diaCierreTarjeta: number) => {
    const [cobrar, pagar] = await Promise.all([
      prisma.deuda.findMany({
        where: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] }, tipo: "COBRAR" },
        select: { montoTotal: true, montoPagado: true, cuotas: { select: { id: true } } },
      }),
      prisma.deuda.findMany({
        where: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] }, tipo: "PAGAR" },
        select: {
          montoTotal: true,
          montoPagado: true,
          cuotas: { select: { id: true, monto: true, fechaVencimiento: true, pagada: true } },
        },
      }),
    ]);

    const sinCuotas = (d: { cuotas: unknown[] }) => d.cuotas.length === 0;
    const conCuotas = (d: { cuotas: unknown[] }) => d.cuotas.length > 0;
    const sumarSaldo = (deudas: { montoTotal: unknown; montoPagado: unknown }[]) =>
      deudas.reduce((acc, d) => acc + (Number(d.montoTotal) - Number(d.montoPagado)), 0);

    // Cuánto de lo que debés (no lo que te deben) vence antes del próximo cierre de tarjeta
    const fechaCierre = getProximoCierre(diaCierreTarjeta);
    const cuotasHastaCierre = pagar.filter(conCuotas).reduce((acc, d) => {
      const pendientes = d.cuotas.filter((c) => !c.pagada && new Date(c.fechaVencimiento) <= fechaCierre);
      return acc + pendientes.reduce((s, c) => s + Number(c.monto), 0);
    }, 0);

    return {
      porCobrar: sumarSaldo(cobrar.filter(sinCuotas)),
      porPagar: sumarSaldo(pagar.filter(sinCuotas)),
      cantidadCobrar: cobrar.filter(sinCuotas).length,
      cantidadPagar: pagar.filter(sinCuotas).length,
      cuotasCobrar: sumarSaldo(cobrar.filter(conCuotas)),
      cuotasPagar: sumarSaldo(pagar.filter(conCuotas)),
      cantidadCuotasCobrar: cobrar.filter(conCuotas).length,
      cantidadCuotasPagar: pagar.filter(conCuotas).length,
      cuotasHastaCierre,
    };
  },
  ["resumen-deudas"],
  { revalidate: 60, tags: ["deudas"] }
);
