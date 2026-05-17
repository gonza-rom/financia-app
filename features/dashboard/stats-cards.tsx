// features/dashboard/stats-cards.tsx
import type { EstadisticasDashboard } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: EstadisticasDashboard;
  moneda: string;
}

export function StatsCards({ stats, moneda }: StatsCardsProps) {
  const tarjetas = [
    {
      label: "Balance Total",
      valor: formatCurrency(stats.balanceTotal, moneda),
      icono: Wallet,
      iconoClase: "bg-primary/10 text-primary",
      cambio: null,
      etiquetaCambio: "Desde siempre",
      positivo: stats.balanceTotal >= 0,
    },
    {
      label: "Ingresos del Mes",
      valor: formatCurrency(stats.ingresoMensual, moneda),
      icono: TrendingUp,
      iconoClase: "bg-income/10 text-income",
      cambio: stats.cambioIngreso,
      etiquetaCambio: "vs mes anterior",
      positivo: true,
    },
    {
      label: "Gastos del Mes",
      valor: formatCurrency(stats.gastoMensual, moneda),
      icono: TrendingDown,
      iconoClase: "bg-expense/10 text-expense",
      cambio: stats.cambioGasto,
      etiquetaCambio: "vs mes anterior",
      positivo: stats.cambioGasto <= 0,
    },
    {
      label: "Ahorro",
      valor: formatCurrency(stats.ahorroMensual, moneda),
      icono: PiggyBank,
      iconoClase: "bg-violet-500/10 text-violet-400",
      cambio: stats.tasaAhorro,
      etiquetaCambio: "tasa de ahorro",
      positivo: stats.ahorroMensual >= 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tarjetas.map((tarjeta) => {
        const Icono = tarjeta.icono;
        return (
          <div key={tarjeta.label} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">{tarjeta.label}</span>
              <div className={cn("size-8 rounded-md flex items-center justify-center", tarjeta.iconoClase)}>
                <Icono className="size-4" />
              </div>
            </div>
            <div>
              <p className={cn(
                "text-2xl font-semibold tracking-tight",
                tarjeta.label === "Balance Total" && !tarjeta.positivo && "text-expense"
              )}>
                {tarjeta.valor}
              </p>
            </div>
            {tarjeta.cambio !== null ? (
              <p className="text-xs text-muted-foreground">
                <span className={cn("font-medium", tarjeta.positivo ? "text-income" : "text-expense")}>
                  {tarjeta.etiquetaCambio === "tasa de ahorro"
                    ? `${tarjeta.cambio.toFixed(1)}%`
                    : `${tarjeta.cambio >= 0 ? "+" : ""}${tarjeta.cambio.toFixed(1)}%`}
                </span>{" "}
                {tarjeta.etiquetaCambio}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{tarjeta.etiquetaCambio}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}