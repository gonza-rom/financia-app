// features/deudas/deuda-header.tsx
import { TrendingDown, TrendingUp, AlertTriangle, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Moneda } from "@/types/deudas";

interface DeudaHeaderProps {
  totalCobrar: number;
  totalPagar: number;
  vencidas: number;
  // Cuotas — se muestran aparte, solo como info, no afectan el balance
  totalCuotasCobrar?: number;
  totalCuotasPagar?: number;
  moneda?: Moneda;
  cuotasEsteMes?: number;  // ← nuevo
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
  totalCuotasCobrar = 0,
  totalCuotasPagar = 0,
  cuotasEsteMes = 0,  // ← agregar
  moneda = "ARS",
}: DeudaHeaderProps) {
  const balance = totalCobrar - totalPagar;
  const isPositive = balance >= 0;
  const tieneCuotas = totalCuotasCobrar > 0 || totalCuotasPagar > 0;

  return (
    <div className="space-y-4">
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

      {/* Tarjetas principales — solo deudas sin cuotas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-emerald-500" />
            Me deben
          </div>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(totalCobrar, moneda)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="size-4 text-rose-500" />
            Yo debo
          </div>
          <p className="text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
            {formatMoney(totalPagar, moneda)}
          </p>
        </div>

        <div className={cn(
          "rounded-xl border p-4 space-y-1",
          isPositive
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
            : "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40"
        )}>
          <div className="text-sm text-muted-foreground">Balance neto</div>
          <p className={cn(
            "text-xl font-semibold tabular-nums",
            isPositive ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
          )}>
            {isPositive ? "+" : ""}{formatMoney(balance, moneda)}
          </p>
        </div>
      </div>

      {/* Cuotas — sección informativa separada, no afecta el balance */}
      {tieneCuotas && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Compromisos en cuotas
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                No afectan el balance
              </span>
            </div>
            {cuotasEsteMes > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Este mes</p>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatMoney(cuotasEsteMes, moneda)}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {totalCuotasCobrar > 0 && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Por cobrar en cuotas</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatMoney(totalCuotasCobrar, moneda)}
                </p>
              </div>
            )}
            {totalCuotasPagar > 0 && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Por pagar en cuotas</p>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatMoney(totalCuotasPagar, moneda)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}