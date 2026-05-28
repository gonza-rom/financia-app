// features/deudas/deuda-header.tsx
import { TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Moneda } from "@/types/deudas";

interface DeudaHeaderProps {
  totalCobrar: number;
  totalPagar: number;
  vencidas: number;
  moneda?: Moneda;
}

function formatMoney(amount: number, moneda: Moneda = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DeudaHeader({
  totalCobrar,
  totalPagar,
  vencidas,
  moneda = "ARS",
}: DeudaHeaderProps) {
  const balance = totalCobrar - totalPagar;
  const isPositive = balance >= 0;

  return (
    <div className="space-y-4">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deudas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Seguimiento de lo que cobrás y lo que debés
          </p>
        </div>
        {vencidas > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-full">
            <AlertTriangle className="size-3.5" />
            {vencidas} vencida{vencidas > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Me deben */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-emerald-500" />
            Me deben
          </div>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(totalCobrar, moneda)}
          </p>
        </div>

        {/* Yo debo */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="size-4 text-rose-500" />
            Yo debo
          </div>
          <p className="text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {formatMoney(totalPagar, moneda)}
          </p>
        </div>

        {/* Balance neto */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-1",
            isPositive
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
              : "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"
          )}
        >
          <div className="text-sm text-muted-foreground">Balance neto</div>
          <p
            className={cn(
              "text-xl font-semibold tabular-nums",
              isPositive
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300"
            )}
          >
            {isPositive ? "+" : ""}
            {formatMoney(balance, moneda)}
          </p>
        </div>
      </div>
    </div>
  );
}