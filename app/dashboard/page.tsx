// app/dashboard/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCachedDashboardStats } from "@/features/dashboard/queries";
import {
  getCachedYearlyChart,
  getCachedCategoryBreakdown,
  getTransaccionesRecientes,
} from "@/features/transactions/queries";
import { StatsCards } from "@/features/dashboard/stats-cards";
import { YearlyChart } from "@/features/dashboard/yearly-chart";
import { CategoryPieChart } from "@/features/dashboard/category-pie-chart";
import { RecentTransactions } from "@/features/dashboard/recent-transactions";
import { StatsSkeleton, ChartSkeleton, TransactionListSkeleton } from "@/components/skeletons";
import { TipoTransaccion } from "@prisma/client";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardData() {
  const usuario = await getCurrentUser();
  const anio = new Date().getFullYear(); 
  const mes = new Date().getMonth() + 1;

  const [stats, graficoDatos, desgloseGastos, transRecientes] = await Promise.all([
    getCachedDashboardStats(usuario.id),
    getCachedYearlyChart(usuario.id, anio),
    getCachedCategoryBreakdown(usuario.id, anio, mes, TipoTransaccion.GASTO),
    getTransaccionesRecientes(usuario.id, 8),
  ]);

  return (
    <>
      <StatsCards stats={stats} moneda={usuario.moneda} />
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <YearlyChart data={graficoDatos} moneda={usuario.moneda} />
        </div>
        <div>
          <CategoryPieChart data={desgloseGastos} moneda={usuario.moneda} />
        </div>
      </div>
      <div className="mt-6">
        <RecentTransactions transacciones={transRecientes} moneda={usuario.moneda} />
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
          Tu resumen financiero de {new Date().toLocaleString("es-AR", { month: "long", year: "numeric" })}
        </p>
      </div>
      <Suspense fallback={
        <div className="space-y-6">
          <StatsSkeleton />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2"><ChartSkeleton /></div>
            <ChartSkeleton />
          </div>
          <TransactionListSkeleton />
        </div>
      }>
        <DashboardData />
      </Suspense>
    </div>
  );
}