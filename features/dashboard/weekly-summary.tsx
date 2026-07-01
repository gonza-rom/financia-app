// features/dashboard/weekly-summary.tsx
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ResumenSemanal } from "./daily-chart-query";

interface WeeklySummaryProps {
  semana: ResumenSemanal;
  moneda: string;
}

function Stat({
  label,
  valor,
  cambio,
  positivo,
  moneda,
}: {
  label: string;
  valor: number;
  cambio: number;
  positivo: boolean;
  moneda: string;
}) {
  const sube = cambio >= 0;
  const Icon = sube ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{formatCurrency(valor, moneda)}</p>
      <div className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
        positivo
          ? "bg-income/10 text-income"
          : "bg-expense/10 text-expense"
      )}>
        <Icon className="size-2.5" />
        {cambio >= 0 ? "+" : ""}{cambio.toFixed(0)}% vs semana ant.
      </div>
    </div>
  );
}

export function WeeklySummary({ semana, moneda }: WeeklySummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-1">
      <Stat
        label="Ingresos esta semana"
        valor={semana.ingresoEstaSemana}
        cambio={semana.cambioIngreso}
        positivo={semana.cambioIngreso >= 0}
        moneda={moneda}
      />
      <Stat
        label="Gastos esta semana"
        valor={semana.gastoEstaSemana}
        cambio={semana.cambioGasto}
        positivo={semana.cambioGasto <= 0}
        moneda={moneda}
      />
    </div>
  );
}