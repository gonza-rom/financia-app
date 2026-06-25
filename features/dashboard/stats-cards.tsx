// features/dashboard/stats-cards.tsx
import type { EstadisticasDashboard } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart3, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: EstadisticasDashboard;
  moneda: string;
}

export function StatsCards({ stats, moneda }: StatsCardsProps) {
  const tarjetas = [
    {
      label: "Patrimonio Neto",
      sublabel: "Flujo histórico + deudas",
      valor: formatCurrency(stats.patrimonioNeto, moneda),
      icono: BarChart3,
      iconoClase: "bg-primary/10 text-primary",
      cambio: null,
      etiquetaCambio: null,
      positivo: stats.patrimonioNeto >= 0,
      detalle: stats.porCobrarPendiente > 0 || stats.porPagarPendiente > 0
        ? `+${formatCurrency(stats.porCobrarPendiente, moneda)} cobrar · -${formatCurrency(stats.porPagarPendiente, moneda)} pagar`
        : `Flujo: ${formatCurrency(stats.balanceTotal, moneda)}`,
    },
    {
      label: "Ingresos del Mes",
      sublabel: null,
      valor: formatCurrency(stats.ingresoMensual, moneda),
      icono: TrendingUp,
      iconoClase: "bg-income/10 text-income",
      cambio: stats.cambioIngreso,
      etiquetaCambio: "vs mes anterior",
      positivo: true,
      detalle: null,
    },
    {
      label: "Gastos del Mes",
      sublabel: null,
      valor: formatCurrency(stats.gastoMensual, moneda),
      icono: TrendingDown,
      iconoClase: "bg-expense/10 text-expense",
      cambio: stats.cambioGasto,
      etiquetaCambio: "vs mes anterior",
      positivo: stats.cambioGasto <= 0,
      detalle: null,
    },
    {
      label: "Ahorro del Mes",
      sublabel: null,
      valor: formatCurrency(stats.ahorroMensual, moneda),
      icono: PiggyBank,
      iconoClase: "bg-violet-500/10 text-violet-400",
      cambio: stats.tasaAhorro,
      etiquetaCambio: "tasa de ahorro",
      positivo: stats.ahorroMensual >= 0,
      detalle: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {tarjetas.map((tarjeta) => {
        const Icono = tarjeta.icono;
        return (
          <div key={tarjeta.label} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground font-medium">{tarjeta.label}</span>
                {tarjeta.sublabel && (
                  <p className="text-[10px] text-muted-foreground/70">{tarjeta.sublabel}</p>
                )}
              </div>
              <div className={cn("size-8 rounded-md flex items-center justify-center shrink-0", tarjeta.iconoClase)}>
                <Icono className="size-4" />
              </div>
            </div>

            <p className={cn(
              "text-2xl font-semibold tracking-tight",
              !tarjeta.positivo && "text-expense"
            )}>
              {tarjeta.valor}
            </p>

            {tarjeta.cambio !== null && tarjeta.etiquetaCambio ? (
              <p className="text-xs text-muted-foreground">
                <span className={cn("font-medium", tarjeta.positivo ? "text-income" : "text-expense")}>
                  {tarjeta.etiquetaCambio === "tasa de ahorro"
                    ? `${tarjeta.cambio.toFixed(1)}%`
                    : `${tarjeta.cambio >= 0 ? "+" : ""}${tarjeta.cambio.toFixed(1)}%`}
                </span>{" "}
                {tarjeta.etiquetaCambio}
              </p>
            ) : tarjeta.detalle ? (
              <p className="text-[10px] text-muted-foreground truncate">{tarjeta.detalle}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}