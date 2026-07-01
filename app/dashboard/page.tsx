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
import { getCachedDailyStats } from "@/features/dashboard/daily-chart-query";
import { StatsCards } from "@/features/dashboard/stats-cards";
import { StatsSection } from "@/features/dashboard/stats-section";
import { YearlyChart } from "@/features/dashboard/yearly-chart";
import { CategoryPieChart } from "@/features/dashboard/category-pie-chart";
import { RecentTransactions } from "@/features/dashboard/recent-transactions";
import { StatsSkeleton, ChartSkeleton, TransactionListSkeleton } from "@/components/skeletons";
import { TipoTransaccion } from "@prisma/client";
import { getCachedResumenDeudas } from "@/features/dashboard/deudas-query";
import { DeudasWidget } from "@/features/dashboard/deudas-widget";

export const metadata: Metadata = { title: "Dashboard" };

async function DashboardData() {
  const usuario = await getCurrentUser();
  const ahora = new Date();
  const anio  = ahora.getFullYear();
  const mes   = ahora.getMonth() + 1;
  const mesLabel = ahora.toLocaleString("es-AR", { month: "long", year: "numeric" });

  const [stats, graficoDatos, desgloseGastos, transRecientes, resumenDeudas, dailyStats] =
    await Promise.all([
      getCachedDashboardStats(usuario.id),
      getCachedYearlyChart(usuario.id, anio),
      getCachedCategoryBreakdown(usuario.id, anio, mes, TipoTransaccion.GASTO),
      getTransaccionesRecientes(usuario.id, 8),
      getCachedResumenDeudas(usuario.id),
      getCachedDailyStats(usuario.id),
    ]);

  return (
    <>
      {/* Cards de resumen */}
      <StatsCards stats={stats} moneda={usuario.moneda} />

      {/* Gráfico diario + resumen semanal */}
      <StatsSection
        dias={dailyStats.dias}
        semana={dailyStats.semana}
        moneda={usuario.moneda}
        mesLabel={mesLabel}
      />

      {/* Widget de deudas */}
      <DeudasWidget
        porCobrar={resumenDeudas.porCobrar}
        porPagar={resumenDeudas.porPagar}
        cantidadCobrar={resumenDeudas.cantidadCobrar}
        cantidadPagar={resumenDeudas.cantidadPagar}
        cuotasCobrar={resumenDeudas.cuotasCobrar}
        cuotasPagar={resumenDeudas.cuotasPagar}
        cantidadCuotasCobrar={resumenDeudas.cantidadCuotasCobrar}
        cantidadCuotasPagar={resumenDeudas.cantidadCuotasPagar}
        moneda={usuario.moneda}
      />

      {/* Gráfico anual + torta de categorías */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <YearlyChart data={graficoDatos} moneda={usuario.moneda} />
        </div>
        <CategoryPieChart data={desgloseGastos} moneda={usuario.moneda} />
      </div>

      {/* Transacciones recientes */}
      <RecentTransactions transacciones={transRecientes} moneda={usuario.moneda} />
    </>
  );
}

export default function DashboardPage() {
  const mesLabel = new Date().toLocaleString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5 capitalize">
          Tu resumen financiero de {mesLabel}
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-6">
          <StatsSkeleton />
          <ChartSkeleton />
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