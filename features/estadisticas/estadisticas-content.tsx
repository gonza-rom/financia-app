// features/estadisticas/estadisticas-content.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraficoDiario } from "./grafico-diario";
import { TablaCategorias } from "./tabla-categorias";
import { GraficoTendencias } from "./grafico-tendencias";
import { formatCurrency, calculatePercentageChange, cn } from "@/lib/utils";
import type { EstadisticasCompletas } from "./queries";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tab = "gastos" | "ingresos" | "neto";

interface EstadisticasContentProps {
  datos: EstadisticasCompletas;
  moneda: string;
}

export function EstadisticasContent({ datos, moneda }: EstadisticasContentProps) {
  const [tab, setTab] = useState<Tab>("gastos");

  const { totalesMes, totalesAnio, totalesMesAnterior } = datos;

  const resumen = {
    gastos: {
      mes: totalesMes.gasto,
      anio: totalesAnio.gasto,
      mesAnterior: totalesMesAnterior.gasto,
      label: "Gastos",
      colorClass: "text-expense",
      subeEsBueno: false,
    },
    ingresos: {
      mes: totalesMes.ingreso,
      anio: totalesAnio.ingreso,
      mesAnterior: totalesMesAnterior.ingreso,
      label: "Ingresos",
      colorClass: "text-income",
      subeEsBueno: true,
    },
    neto: {
      mes: totalesMes.neto,
      anio: totalesAnio.neto,
      mesAnterior: totalesMesAnterior.neto,
      label: "Neto",
      colorClass: totalesMes.neto >= 0 ? "text-income" : "text-expense",
      subeEsBueno: true,
    },
  }[tab];

  const cambioMes = calculatePercentageChange(resumen.mes, resumen.mesAnterior);
  const subeMes = cambioMes >= 0;
  const cambioEsPositivo = resumen.subeEsBueno ? subeMes : !subeMes;
  const IconoCambio = subeMes ? TrendingUp : TrendingDown;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="space-y-6">

      {/* Tabs + resumen */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <TabsList>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="neto">Neto</TabsTrigger>
        </TabsList>

        {/* Resumen rápido del tab activo */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Este mes</p>
            <p className={cn("text-lg font-semibold tabular-nums", resumen.colorClass)}>
              {formatCurrency(resumen.mes, moneda)}
            </p>
            <div className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5",
              cambioEsPositivo ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
            )}>
              <IconoCambio className="size-2.5" />
              {cambioMes >= 0 ? "+" : ""}{cambioMes.toFixed(0)}% vs mes ant.
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Este año</p>
            <p className={cn("text-lg font-semibold tabular-nums", resumen.colorClass)}>
              {formatCurrency(resumen.anio, moneda)}
            </p>
          </div>
        </div>
      </div>

      {/* El contenido de los 3 tabs es el mismo — solo cambia la vista */}
      {(["gastos", "ingresos", "neto"] as Tab[]).map((t) => (
        <TabsContent key={t} value={t} className="space-y-6 mt-0">

          {/* Sección 1: Análisis diario */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Movimientos diarios</h2>
              <p className="text-xs text-muted-foreground">
                Día a día del mes seleccionado
              </p>
            </div>
            <GraficoDiario datos={datos.diasMes} moneda={moneda} tab={t} />
          </div>

          {/* Sección 2: Categorías */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Por categoría</h2>
              <p className="text-xs text-muted-foreground">
                Mes seleccionado vs histórico · Cliqueá el encabezado para ordenar
              </p>
            </div>
            <TablaCategorias
              categorias={datos.categorias}
              moneda={moneda}
              tab={t}
            />
          </div>

          {/* Sección 3: Tendencias */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold">Tendencia histórica</h2>
              <p className="text-xs text-muted-foreground">
                Últimos 6 meses
              </p>
            </div>
            <GraficoTendencias
              datos={datos.historico6Meses}
              moneda={moneda}
              tab={t}
            />
          </div>

        </TabsContent>
      ))}
    </Tabs>
  );
}