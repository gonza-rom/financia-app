// features/dashboard/deudas-widget.tsx
import { TrendingUp, TrendingDown, AlertCircle , Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DeudasWidgetProps {
  porCobrar: number;
  porPagar: number;
  cantidadCobrar: number;
  cantidadPagar: number;
  cuotasCobrar: number;
  cuotasPagar: number;
  cantidadCuotasCobrar: number;
  cantidadCuotasPagar: number;
  moneda: string;
}

export function DeudasWidget({
  porCobrar, porPagar, cantidadCobrar, cantidadPagar,
  cuotasCobrar, cuotasPagar, cantidadCuotasCobrar, cantidadCuotasPagar,
  moneda,
}: DeudasWidgetProps) {
  const neto = porCobrar - porPagar;
  const hayDeudas = cantidadCobrar > 0 || cantidadPagar > 0;
  const hayCuotas = cantidadCuotasCobrar > 0 || cantidadCuotasPagar > 0;

  if (!hayDeudas && !hayCuotas) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Deudas pendientes</h2>
        </div>
        <Link href="/deudas" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Ver todas →
        </Link>
      </div>

      {/* Deudas sin cuotas */}
      {hayDeudas && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-income/5 border border-income/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="size-3.5 text-income" />
                <span className="text-xs text-muted-foreground">Te deben</span>
              </div>
              <p className="text-lg font-semibold text-income">{formatCurrency(porCobrar, moneda)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cantidadCobrar} deuda{cantidadCobrar !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-lg bg-expense/5 border border-expense/20 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="size-3.5 text-expense" />
                <span className="text-xs text-muted-foreground">Debés</span>
              </div>
              <p className="text-lg font-semibold text-expense">{formatCurrency(porPagar, moneda)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cantidadPagar} deuda{cantidadPagar !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2",
            neto >= 0 ? "bg-income/5" : "bg-expense/5"
          )}>
            <span className="text-xs text-muted-foreground">Posición neta</span>
            <span className={cn("text-sm font-semibold", neto >= 0 ? "text-income" : "text-expense")}>
              {neto >= 0 ? "+" : ""}{formatCurrency(neto, moneda)}
            </span>
          </div>
        </>
      )}

      {/* Cuotas — sección separada */}
      {hayCuotas && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Receipt className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Compromisos en cuotas</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              no afectan el balance
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cantidadCuotasCobrar > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Por cobrar</p>
                <p className="text-sm font-semibold text-income">{formatCurrency(cuotasCobrar, moneda)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {cantidadCuotasCobrar} deuda{cantidadCuotasCobrar !== 1 ? "s" : ""}
                </p>
              </div>
            )}
            {cantidadCuotasPagar > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Por pagar</p>
                <p className="text-sm font-semibold text-expense">{formatCurrency(cuotasPagar, moneda)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {cantidadCuotasPagar} deuda{cantidadCuotasPagar !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
