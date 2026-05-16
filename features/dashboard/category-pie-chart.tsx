// src/features/dashboard/category-pie-chart.tsx
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CategoryBreakdown } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
  currency: string;
}

export function CategoryPieChart({ data, currency }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-center h-full min-h-[300px]">
        <p className="text-sm text-muted-foreground">No expense data this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Expenses by Category</h2>
        <p className="text-xs text-muted-foreground">This month</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as CategoryBreakdown;
              return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
                  <p className="font-medium">{d.categoryName}</p>
                  <p className="text-muted-foreground">{formatCurrency(d.amount, currency)}</p>
                  <p className="text-muted-foreground">{d.percentage.toFixed(1)}%</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-3">
        {data.slice(0, 5).map((item) => (
          <div key={item.categoryId} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.categoryName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(item.amount, currency)}</span>
              <span className="text-muted-foreground w-10 text-right">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}