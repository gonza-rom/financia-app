// features/estadisticas/estadisticas-content.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraficoDiario } from "./grafico-diario";
import { TablaCategorias } from "./tabla-categorias";
import { GraficoTendencias } from "./grafico-tendencias";
import { formatCurrency } from "@/lib/utils";
import type { EstadisticasCompletas } from "./queries";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "gastos" | "ingresos" | "neto";

interface EstadisticasContentProps {
  datos: EstadisticasCompletas;
  moneda: string;
}

export function EstadisticasContent({ datos, moneda }: EstadisticasContentProps) {
  const [tab, setTab] = useState<Tab>("gastos");

  const { totalesMes, totalesAnio } = datos;

  const resumen = {
    gastos: {
      mes: totalesMes.gasto,
      anio: totalesAnio.gasto,
      label: "Gastos",
      colorClass: "text-expense",
    },
    ingresos: {
      mes: totalesMes.ingreso,
      anio: totalesAnio.ingreso,
      label: "Ingresos",
      colorClass: "text-income",
    },
    neto: {
      mes: totalesMes.neto,
      anio: totalesAnio.neto,
      label: "Neto",
      colorClass: totalesMes.neto >= 0 ? "text-income" : "text-expense",
    },
  }[tab];

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