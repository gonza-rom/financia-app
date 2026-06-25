// features/cuentas/queries.ts
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { CuentaConStats } from "@/types/cuentas";
import { unstable_cache } from "next/cache";

export const getCachedCuentas = unstable_cache(
  async (usuarioId: string): Promise<CuentaConStats[]> => {
    const cuentas = await prisma.cuenta.findMany({
      where: { usuarioId, activo: true },
      include: { _count: { select: { transacciones: true } } },
      orderBy: { creadoEn: "asc" },
    });

    return cuentas.map((c) => ({
      ...c,
      saldo: Number(c.saldo),
      cantidadTransacciones: c._count.transacciones,
      _count: { transacciones: c._count.transacciones }, // ← agregar
    }));
  },
  ["cuentas"],
  { revalidate: 60, tags: ["cuentas"] }
);

export async function getCuentas(usuarioId: string) {
  const cuentas = await prisma.cuenta.findMany({
    where: { usuarioId, activo: true },
    orderBy: { nombre: "asc" },
  });
  return cuentas.map((c) => ({ ...c, saldo: Number(c.saldo) }));
}

export const getCachedSaldoTotalCuentas = unstable_cache(
  async (usuarioId: string): Promise<number> => {
    const result = await prisma.cuenta.aggregate({
      where: { usuarioId, activo: true },
      _sum: { saldo: true },
    });
    return Number(result._sum.saldo ?? 0);
  },
  ["saldo-total-cuentas"],
  { revalidate: 30, tags: ["cuentas", "transacciones"] }
);