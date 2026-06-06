// features/dashboard/deudas-query.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getCachedResumenDeudas = unstable_cache(
  async (usuarioId: string) => {
    const estadosActivos = { in: ["PENDIENTE", "VENCIDA"] } as const;

    const [cobrar, pagar] = await Promise.all([
      prisma.deuda.findMany({
        where: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] as const }, tipo: "COBRAR" },
        select: { montoTotal: true, montoPagado: true },
      }),
      prisma.deuda.findMany({
        where: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] as const }, tipo: "PAGAR" },
        select: { montoTotal: true, montoPagado: true },
      }),
    ]);

    const sumarSaldo = (deudas: { montoTotal: unknown; montoPagado: unknown }[]) =>
      deudas.reduce((acc, d) => acc + (Number(d.montoTotal) - Number(d.montoPagado)), 0);

    return {
      porCobrar: sumarSaldo(cobrar),
      porPagar: sumarSaldo(pagar),
      cantidadCobrar: cobrar.length,
      cantidadPagar: pagar.length,
    };
  },
  ["resumen-deudas"],
  { revalidate: 60, tags: ["deudas"] }
);