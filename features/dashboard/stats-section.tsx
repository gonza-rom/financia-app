// features/dashboard/stats-section.tsx
// Sección que combina gráfico diario + resumen semanal en una card

import { DailyChart } from "./daily-chart";
import { WeeklySummary } from "./weekly-summary";
import type { DatoDiario, ResumenSemanal } from "./daily-chart-query";

interface StatsSectionProps {
  dias: DatoDiario[];
  semana: ResumenSemanal;
  moneda: string;
  mesLabel: string; // ej: "junio 2026"
}

export function StatsSection({ dias, semana, moneda, mesLabel }: StatsSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold">Movimientos diarios</h2>
          <p className="text-xs text-muted-foreground capitalize">{mesLabel}</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-income inline-block" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-expense inline-block" />
            Gastos
          </span>
        </div>
      </div>

      <DailyChart datos={dias} moneda={moneda} />

      <div className="border-t border-border mt-4 pt-4">
        <WeeklySummary semana={semana} moneda={moneda} />
      </div>
    </div>
  );
}