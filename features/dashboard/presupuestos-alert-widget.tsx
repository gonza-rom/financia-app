// features/dashboard/presupuestos-alert-widget.tsx
import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { PresupuestoConProgreso } from "@/features/presupuestos/queries";

const UMBRAL_AVISO = 80;

export function PresupuestosAlertWidget({
  presupuestos, moneda,
}: {
  presupuestos: PresupuestoConProgreso[];
  moneda: string;
}) {
  const enAlerta = presupuestos
    .filter((p) => p.porcentaje >= UMBRAL_AVISO)
    .sort((a, b) => b.porcentaje - a.porcentaje);

  if (enAlerta.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <PiggyBank className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Presupuestos</h2>
      </div>

      <div className="space-y-1.5">
        {enAlerta.map((p) => {
          const pasado = p.porcentaje >= 100;
          return (
            <Link
              key={p.id}
              href="/categories"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50",
                pasado ? "bg-expense/5 border border-expense/20" : "bg-amber-500/5 border border-amber-500/20"
              )}
            >
              <div
                className="size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ backgroundColor: `${p.color}20`, color: p.color }}
              >
                {p.nombreCategoria.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.nombreCategoria}</p>
                <p className={cn("text-xs truncate", pasado ? "text-expense" : "text-amber-500")}>
                  {formatCurrency(p.gastado, moneda)} de {formatCurrency(p.monto, moneda)}
                  {" · "}
                  {pasado ? "te pasaste" : `${p.porcentaje.toFixed(0)}%`}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
