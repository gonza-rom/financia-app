// src/features/transactions/queries.ts
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PaginatedResult, TransactionWithCategory } from "@/types";
import { TransactionType } from "@prisma/client";
import { unstable_cache } from "next/cache";

export type GetTransactionsParams = {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export async function getTransactions(
  userId: string,
  params: GetTransactionsParams = {}
): Promise<PaginatedResult<TransactionWithCategory>> {
  const { page = 1, limit = 20, type, categoryId, search, dateFrom, dateTo } = params;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(search && {
      description: { contains: search, mode: "insensitive" as const },
    }),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecentTransactions(userId: string, limit = 10) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export const getCachedMonthlyStats = unstable_cache(
  async (userId: string, year: number, month: number) => {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    const income =
      result.find((r) => r.type === TransactionType.INCOME)?._sum.amount ?? 0;
    const expenses =
      result.find((r) => r.type === TransactionType.EXPENSE)?._sum.amount ?? 0;

    return {
      income: Number(income),
      expenses: Number(expenses),
      savings: Number(income) - Number(expenses),
    };
  },
  ["monthly-stats"],
  { revalidate: 60, tags: ["transactions"] }
);

export const getCachedCategoryBreakdown = unstable_cache(
  async (userId: string, year: number, month: number, type: TransactionType) => {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const result = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type, date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: result.map((r) => r.categoryId) } },
    });

    const total = result.reduce((acc, r) => acc + Number(r._sum.amount ?? 0), 0);

    return result.map((r) => {
      const cat = categories.find((c) => c.id === r.categoryId)!;
      const amount = Number(r._sum.amount ?? 0);
      return {
        categoryId: r.categoryId,
        categoryName: cat?.name ?? "Unknown",
        color: cat?.color ?? "#6b7280",
        icon: cat?.icon ?? "circle",
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        count: r._count,
      };
    });
  },
  ["category-breakdown"],
  { revalidate: 60, tags: ["transactions"] }
);

export const getCachedYearlyChart = unstable_cache(
  async (userId: string, year: number) => {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const result = await prisma.$queryRaw<
      { month: number; type: TransactionType; total: number }[]
    >`
      SELECT 
        EXTRACT(MONTH FROM date)::int AS month,
        type,
        SUM(amount)::float AS total
      FROM transactions
      WHERE "userId" = ${userId}
        AND date >= ${from}
        AND date <= ${to}
      GROUP BY month, type
      ORDER BY month
    `;

    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const income = result.find((r) => r.month === m && r.type === TransactionType.INCOME)?.total ?? 0;
      const expenses = result.find((r) => r.month === m && r.type === TransactionType.EXPENSE)?.total ?? 0;
      return {
        month: new Date(year, i, 1).toLocaleString("en-US", { month: "short" }),
        income,
        expenses,
        savings: income - expenses,
      };
    });

    return months;
  },
  ["yearly-chart"],
  { revalidate: 300, tags: ["transactions"] }
);