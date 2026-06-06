// features/dashboard/deudas-widget.tsx
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DeudasWidgetProps {
  porCobrar: number;
  porPagar: number;
  cantidadCobrar: number;
  cantidadPagar: number;
  moneda: string;
}

export function DeudasWidget({
  porCobrar,
  porPagar,
  cantidadCobrar,
  cantidadPagar,
  moneda,
}: DeudasWidgetProps) {
  const neto = porCobrar - porPagar;
  const hayDeudas = cantidadCobrar > 0 || cantidadPagar > 0;

  if (!hayDeudas) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Deudas pendientes</h2>
        </div>
        <Link
          href="/deudas"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Por cobrar */}
        <div className="rounded-lg bg-income/5 border border-income/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="size-3.5 text-income" />
            <span className="text-xs text-muted-foreground">Te deben</span>
          </div>
          <p className="text-lg font-semibold text-income">
            {formatCurrency(porCobrar, moneda)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cantidadCobrar} deuda{cantidadCobrar !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Por pagar */}
        <div className="rounded-lg bg-expense/5 border border-expense/20 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="size-3.5 text-expense" />
            <span className="text-xs text-muted-foreground">Debés</span>
          </div>
          <p className="text-lg font-semibold text-expense">
            {formatCurrency(porPagar, moneda)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cantidadPagar} deuda{cantidadPagar !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Neto */}
      <div className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2",
        neto >= 0 ? "bg-income/5" : "bg-expense/5"
      )}>
        <span className="text-xs text-muted-foreground">Posición neta</span>
        <span className={cn(
          "text-sm font-semibold",
          neto >= 0 ? "text-income" : "text-expense"
        )}>
          {neto >= 0 ? "+" : ""}{formatCurrency(neto, moneda)}
        </span>
      </div>
    </div>
  );
}
