// features/dashboard/hoy-resumen.tsx
// Resumen rápido de "¿cómo voy hoy?" — cuánto gasté y cuánto gané hoy, y el neto.

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HoyResumenProps {
  ingresoHoy: number;
  gastoHoy: number;
  moneda: string;
}

export function HoyResumen({ ingresoHoy, gastoHoy, moneda }: HoyResumenProps) {
  const neto = ingresoHoy - gastoHoy;
  const sinMovimientos = ingresoHoy === 0 && gastoHoy === 0;

  const Icon = neto > 0 ? ArrowUpRight : neto < 0 ? ArrowDownRight : Minus;
  const mensaje = sinMovimientos
    ? "Sin movimientos todavía hoy"
    : neto > 0
    ? "Ganaste más de lo que gastaste hoy"
    : neto < 0
    ? "Gastaste más de lo que ganaste hoy"
    : "Empatado hoy";

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3 mb-4 flex-wrap">
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          "size-8 rounded-full flex items-center justify-center shrink-0",
          sinMovimientos ? "bg-muted text-muted-foreground"
            : neto > 0 ? "bg-income/10 text-income"
            : "bg-expense/10 text-expense"
        )}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Hoy</p>
          <p className="text-sm font-medium">{mensaje}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-[11px] text-muted-foreground">Ganaste</p>
          <p className="text-sm font-semibold text-income tabular-nums">{formatCurrency(ingresoHoy, moneda)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Gastaste</p>
          <p className="text-sm font-semibold text-expense tabular-nums">{formatCurrency(gastoHoy, moneda)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Neto</p>
          <p className={cn(
            "text-sm font-bold tabular-nums",
            neto > 0 ? "text-income" : neto < 0 ? "text-expense" : "text-muted-foreground"
          )}>
            {neto > 0 ? "+" : neto < 0 ? "−" : ""}{formatCurrency(Math.abs(neto), moneda)}
          </p>
        </div>
      </div>
    </div>
  );
}
