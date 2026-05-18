// features/categories/queries.ts
import { prisma } from "@/lib/prisma";
import type { CategoriaConEstadisticas } from "@/types";
import { unstable_cache } from "next/cache";

// Con cache + tag — se invalida cuando se crea/edita/elimina una categoría
export const getCachedCategorias = unstable_cache(
  async (usuarioId: string): Promise<CategoriaConEstadisticas[]> => {
    const [categorias, totales] = await Promise.all([
      prisma.categoria.findMany({
        where: { usuarioId },
        include: { _count: { select: { transacciones: true } } },
        orderBy: { nombre: "asc" },
      }),
      prisma.transaccion.groupBy({
        by: ["categoriaId"],
        where: { usuarioId },
        _sum: { monto: true },
      }),
    ]);

    return categorias.map((cat) => ({
      ...cat,
      montoTotal: Number(totales.find((t) => t.categoriaId === cat.id)?._sum.monto ?? 0),
    }));
  },
  ["categorias"],
  { revalidate: 60, tags: ["categorias", "transacciones"] }
);

// Sin cache — para selects en formularios (siempre fresca)
export async function getCategorias(usuarioId: string) {
  return prisma.categoria.findMany({
    where: { usuarioId },
    orderBy: { nombre: "asc" },
  });
}

// Alias para la página de categorías
export async function getCategoriesWithStats(usuarioId: string) {
  return getCachedCategorias(usuarioId);
}