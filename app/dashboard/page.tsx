// src/app/dashboard/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCachedDashboardStats } from "@/features/dashboard/queries";
import {
  getCachedYearlyChart,
  getCachedCategoryBreakdown,
  getRecentTransactions,
} from "@/features/transactions/queries";
import { StatsCards } from "@/features/dashboard/stats-cards";
import { YearlyChart } from "@/features/dashboard/yearly-chart";
import { CategoryPieChart } from "@/features/dashboard/category-pie-chart";
import { RecentTransactions } from "@/features/dashboard/recent-transactions";
import {
  StatsSkeleton,
  ChartSkeleton,
  TransactionListSkeleton,
} from "@/components/skeletons";
import { TransactionType } from "@prisma/client";

export const metadata: Metadata = { title: "Dashboard" };

// Dashboard data component — split into Suspense boundaries
async function DashboardData() {
  const user = await getCurrentUser();
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const [stats, chartData, expenseBreakdown, recentTxns] = await Promise.all([
    getCachedDashboardStats(user.id),
    getCachedYearlyChart(user.id, year),
    getCachedCategoryBreakdown(user.id, year, month, TransactionType.EXPENSE),
    getRecentTransactions(user.id, 8),
  ]);

  return (
    <>
      <StatsCards stats={stats} currency={user.currency} />

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <YearlyChart data={chartData} currency={user.currency} />
        </div>
        <div>
          <CategoryPieChart data={expenseBreakdown} currency={user.currency} />
        </div>
      </div>

      <div className="mt-6">
        <RecentTransactions transactions={recentTxns} currency={user.currency} />
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your financial overview for {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsSkeleton />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ChartSkeleton />
              </div>
              <ChartSkeleton />
            </div>
            <TransactionListSkeleton />
          </div>
        }
      >
        <DashboardData />
      </Suspense>
    </div>
  );
}