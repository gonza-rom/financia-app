// features/presupuestos/queries.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getMonthRange } from "@/lib/utils";

export interface PresupuestoConProgreso {
  id: string;
  categoriaId: string;
  nombreCategoria: string;
  color: string;
  monto: number;
  gastado: number;
  porcentaje: number;
}

// Presupuestos + cuánto se gastó este mes en cada categoría (y sus subcategorías,
// si el presupuesto está puesto en una categoría padre — si no, la plata cargada en
// las subcategorías nunca aparecería reflejada en el progreso del padre).
export const getCachedPresupuestos = unstable_cache(
  async (usuarioId: string): Promise<PresupuestoConProgreso[]> => {
    const [presupuestos, categorias] = await Promise.all([
      prisma.presupuesto.findMany({ where: { usuarioId }, include: { categoria: true } }),
      prisma.categoria.findMany({ where: { usuarioId }, select: { id: true, parentId: true } }),
    ]);

    if (presupuestos.length === 0) return [];

    const { from, to } = getMonthRange();
    const gastos = await prisma.transaccion.groupBy({
      by: ["categoriaId"],
      where: { usuarioId, tipo: "GASTO", fecha: { gte: from, lte: to } },
      _sum: { monto: true },
    });
    const gastoPorCategoria = new Map(gastos.map((g) => [g.categoriaId, Number(g._sum.monto ?? 0)]));

    return presupuestos
      .map((p) => {
        const idsRelevantes = [
          p.categoriaId,
          ...categorias.filter((c) => c.parentId === p.categoriaId).map((c) => c.id),
        ];
        const gastado = idsRelevantes.reduce((acc, id) => acc + (gastoPorCategoria.get(id) ?? 0), 0);
        const monto = Number(p.monto);

        return {
          id: p.id,
          categoriaId: p.categoriaId,
          nombreCategoria: p.categoria.nombre,
          color: p.categoria.color,
          monto,
          gastado,
          porcentaje: monto > 0 ? (gastado / monto) * 100 : 0,
        };
      })
      .sort((a, b) => b.porcentaje - a.porcentaje);
  },
  ["presupuestos"],
  { revalidate: 60, tags: ["presupuestos", "transacciones", "categorias"] }
);
