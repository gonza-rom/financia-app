// src/features/dashboard/queries.ts
import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/types";
import { TransactionType } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { getMonthRange, getPreviousMonthRange, calculatePercentageChange } from "@/lib/utils";

export const getCachedDashboardStats = unstable_cache(
  async (userId: string): Promise<DashboardStats> => {
    const now = new Date();
    const { from: monthFrom, to: monthTo } = getMonthRange(now);
    const { from: prevFrom, to: prevTo } = getPreviousMonthRange(now);

    const [currentMonth, previousMonth, allTime] = await Promise.all([
      // Current month totals
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { gte: monthFrom, lte: monthTo } },
        _sum: { amount: true },
      }),
      // Previous month totals
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { gte: prevFrom, lte: prevTo } },
        _sum: { amount: true },
      }),
      // All-time balance
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

    const getAmount = (
      data: { type: TransactionType; _sum: { amount: unknown } }[],
      type: TransactionType
    ) => Number(data.find((r) => r.type === type)?._sum.amount ?? 0);

    const monthlyIncome = getAmount(currentMonth, TransactionType.INCOME);
    const monthlyExpenses = getAmount(currentMonth, TransactionType.EXPENSE);
    const prevIncome = getAmount(previousMonth, TransactionType.INCOME);
    const prevExpenses = getAmount(previousMonth, TransactionType.EXPENSE);
    const allIncome = getAmount(allTime, TransactionType.INCOME);
    const allExpenses = getAmount(allTime, TransactionType.EXPENSE);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    return {
      totalBalance: allIncome - allExpenses,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      incomeChange: calculatePercentageChange(monthlyIncome, prevIncome),
      expenseChange: calculatePercentageChange(monthlyExpenses, prevExpenses),
      savingsRate,
    };
  },
  ["dashboard-stats"],
  { revalidate: 60, tags: ["transactions"] }
);