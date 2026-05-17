// features/dashboard/recent-transactions.tsx
import Link from "next/link";
import type { TransaccionConCategoria } from "@/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { TipoTransaccion } from "@prisma/client";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transacciones: TransaccionConCategoria[];
  moneda: string;
}

export function RecentTransactions({ transacciones, moneda }: RecentTransactionsProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">Transacciones Recientes</h2>
        <Link href="/transacciones" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          Ver todas <ArrowRight className="size-3" />
        </Link>
      </div>
      {transacciones.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Sin transacciones aún</p>
          <Link href="/transacciones" className="text-sm text-primary hover:underline mt-1 inline-block">
            Agregar la primera
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {transacciones.map((tx) => {
            const esIngreso = tx.tipo === TipoTransaccion.INGRESO;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                <div
                  className="size-9 rounded-full flex items-center justify-center shrink-0 text-sm font-medium"
                  style={{ backgroundColor: `${tx.categoria.color}20`, color: tx.categoria.color }}
                >
                  {tx.categoria.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categoria.nombre} · {formatShortDate(tx.fecha)}
                  </p>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums", esIngreso ? "text-income" : "text-expense")}>
                  {esIngreso ? "+" : "-"}{formatCurrency(Number(tx.monto), moneda)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}