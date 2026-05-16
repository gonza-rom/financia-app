// src/features/dashboard/stats-cards.tsx
import type { DashboardStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: DashboardStats;
  currency: string;
}

export function StatsCards({ stats, currency }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Balance",
      value: formatCurrency(stats.totalBalance, currency),
      icon: Wallet,
      iconClass: "bg-primary/10 text-primary",
      change: null,
      changeLabel: "All time",
      positive: stats.totalBalance >= 0,
    },
    {
      label: "Monthly Income",
      value: formatCurrency(stats.monthlyIncome, currency),
      icon: TrendingUp,
      iconClass: "bg-income/10 text-income",
      change: stats.incomeChange,
      changeLabel: "vs last month",
      positive: true,
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(stats.monthlyExpenses, currency),
      icon: TrendingDown,
      iconClass: "bg-expense/10 text-expense",
      change: stats.expenseChange,
      changeLabel: "vs last month",
      positive: stats.expenseChange <= 0,
    },
    {
      label: "Savings",
      value: formatCurrency(stats.monthlySavings, currency),
      icon: PiggyBank,
      iconClass: "bg-violet-500/10 text-violet-400",
      change: stats.savingsRate,
      changeLabel: "savings rate",
      positive: stats.monthlySavings >= 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">{card.label}</span>
              <div className={cn("size-8 rounded-md flex items-center justify-center", card.iconClass)}>
                <Icon className="size-4" />
              </div>
            </div>

            <div>
              <p className={cn(
                "text-2xl font-semibold tracking-tight",
                card.label === "Total Balance" && !card.positive && "text-expense"
              )}>
                {card.value}
              </p>
            </div>

            {card.change !== null ? (
              <p className="text-xs text-muted-foreground">
                <span className={cn(
                  "font-medium",
                  card.positive ? "text-income" : "text-expense"
                )}>
                  {card.changeLabel === "savings rate"
                    ? `${card.change.toFixed(1)}%`
                    : `${card.change >= 0 ? "+" : ""}${card.change.toFixed(1)}%`}
                </span>{" "}
                {card.changeLabel}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{card.changeLabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}