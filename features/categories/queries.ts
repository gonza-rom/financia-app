// src/features/categories/queries.ts
import { prisma } from "@/lib/prisma";
import type { CategoryWithStats } from "@/types";
import { unstable_cache } from "next/cache";

export const getCachedCategories = unstable_cache(
  async (userId: string): Promise<CategoryWithStats[]> => {
    const categories = await prisma.category.findMany({
      where: { userId },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: "asc" },
    });

    // Get totals per category
    const totals = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId },
      _sum: { amount: true },
    });

    return categories.map((cat) => ({
      ...cat,
      totalAmount: Number(
        totals.find((t) => t.categoryId === cat.id)?._sum.amount ?? 0
      ),
    }));
  },
  ["categories"],
  { revalidate: 60, tags: ["categories"] }
);

// Non-cached version for use in forms (always fresh)
export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}