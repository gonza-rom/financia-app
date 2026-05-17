// src/features/transactions/transaction-list.tsx
"use client";

import type { Category, TransactionWithCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteTransactionButton } from "./delete-transaction-button";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchParams } from "next/navigation";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}

export function TransactionList({
  transactions,
  categories,
  total,
  page,
  totalPages,
}: TransactionListProps) {
  const searchParams = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingTx = transactions.find((t) => t.id === editingId);

  function buildPageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground text-sm">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {total} transaction{total !== 1 ? "s" : ""}
      </p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {transactions.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-4 group">
                <div
                  className="size-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                  style={{
                    backgroundColor: `${tx.category.color}20`,
                    color: tx.category.color,
                  }}
                >
                  {tx.category.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category.name} · {formatDate(tx.date)}
                    {tx.isRecurring && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                        Recurring
                      </span>
                    )}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums shrink-0",
                    isIncome ? "text-income" : "text-expense"
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(Number(tx.amount))}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setEditingId(tx.id)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteTransactionButton id={tx.id} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={buildPageHref(page - 1)} />
              </PaginationItem>
            )}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext href={buildPageHref(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}

      {editingTx && (
        <EditTransactionDialog
          transaction={editingTx}
          categories={categories}
          open={!!editingId}
          onOpenChange={(o) => !o && setEditingId(null)}
        />
      )}
    </div>
  );
}