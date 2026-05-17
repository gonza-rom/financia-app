// features/categories/queries.ts
import { prisma } from "@/lib/prisma";
import type { CategoriaConEstadisticas } from "@/types";
import { unstable_cache } from "next/cache";

export const getCachedCategorias = unstable_cache(
  async (usuarioId: string): Promise<CategoriaConEstadisticas[]> => {
    const categorias = await prisma.categoria.findMany({
      where: { usuarioId },
      include: { _count: { select: { transacciones: true } } },
      orderBy: { nombre: "asc" },
    });

    const totales = await prisma.transaccion.groupBy({
      by: ["categoriaId"],
      where: { usuarioId },
      _sum: { monto: true },
    });

    return categorias.map((cat) => ({
      ...cat,
      montoTotal: Number(totales.find((t) => t.categoriaId === cat.id)?._sum.monto ?? 0),
    }));
  },
  ["categorias"],
  { revalidate: 60, tags: ["categorias"] }
);

export async function getCategorias(usuarioId: string) {
  return prisma.categoria.findMany({
    where: { usuarioId },
    orderBy: { nombre: "asc" },
  });
}

export async function getCategoriesWithStats(usuarioId: string) {
  return getCachedCategorias(usuarioId);
}