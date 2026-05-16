// src/features/dashboard/recent-transactions.tsx
import Link from "next/link";
import type { TransactionWithCategory } from "@/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { TransactionType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface RecentTransactionsProps {
  transactions: TransactionWithCategory[];
  currency: string;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <Link href="/transactions" className="text-sm text-primary hover:underline mt-1 inline-block">
            Add your first transaction
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {transactions.map((tx) => {
            const isIncome = tx.type === TransactionType.INCOME;
            return (
              <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
                {/* Category color dot */}
                <div
                  className="size-9 rounded-full flex items-center justify-center shrink-0 text-sm font-medium"
                  style={{ backgroundColor: `${tx.category.color}20`, color: tx.category.color }}
                >
                  {tx.category.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.category.name} · {formatShortDate(tx.date)}
                  </p>
                </div>

                <span className={cn(
                  "text-sm font-semibold tabular-nums",
                  isIncome ? "text-income" : "text-expense"
                )}>
                  {isIncome ? "+" : "-"}{formatCurrency(Number(tx.amount), currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}