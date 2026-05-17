// features/transactions/transaction-list.tsx
"use client";

import type { Categoria, TransaccionConCategoria } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TipoTransaccion } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { useState } from "react";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";

interface TransactionListProps {
  transacciones: TransaccionConCategoria[];
  categorias: Categoria[];
  moneda: string;
  total: number;
  pagina: number;
  totalPaginas: number;
}

export function TransactionList({ transacciones, categorias, moneda, total, pagina, totalPaginas }: TransactionListProps) {
  const searchParams = useSearchParams();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const editandoTx = transacciones.find((t) => t.id === editandoId);

  function buildPageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", String(p));
    return `?${params.toString()}`;
  }

  if (transacciones.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground text-sm">No se encontraron transacciones</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {total} transacción{total !== 1 ? "es" : ""}
      </p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {transacciones.map((tx) => {
            const esIngreso = tx.tipo === TipoTransaccion.INGRESO;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-4 group">
                <div
                  className="size-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                  style={{ backgroundColor: `${tx.categoria.color}20`, color: tx.categoria.color }}
                >
                  {tx.categoria.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.descripcion}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.categoria.nombre} · {formatDate(tx.fecha)}
                    {tx.esRecurrente && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                        Recurrente
                      </span>
                    )}
                  </p>
                </div>
                <span className={cn("text-sm font-semibold tabular-nums shrink-0", esIngreso ? "text-income" : "text-expense")}>
                  {esIngreso ? "+" : "-"}{formatCurrency(Number(tx.monto), moneda)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditandoId(tx.id)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteTransactionButton id={tx.id} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {totalPaginas > 1 && (
        <Pagination>
          <PaginationContent>
            {pagina > 1 && <PaginationItem><PaginationPrevious href={buildPageHref(pagina - 1)} /></PaginationItem>}
            {pagina < totalPaginas && <PaginationItem><PaginationNext href={buildPageHref(pagina + 1)} /></PaginationItem>}
          </PaginationContent>
        </Pagination>
      )}
      {editandoTx && (
        <EditTransactionDialog
          transaccion={editandoTx}
          categorias={categorias}
          open={!!editandoId}
          onOpenChange={(o) => !o && setEditandoId(null)}
        />
      )}
    </div>
  );
}