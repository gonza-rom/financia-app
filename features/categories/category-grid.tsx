// src/features/categories/category-grid.tsx
"use client";

import type { CategoryWithStats } from "@/types";
import { TransactionType } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryDialog } from "./edit-category-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CategoryGridProps {
  categories: CategoryWithStats[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const income = categories.filter((c) => c.type === TransactionType.INCOME);
  const expense = categories.filter((c) => c.type === TransactionType.EXPENSE);
  const editingCat = categories.find((c) => c.id === editingId);

  function Section({
    title,
    items,
    type,
  }: {
    title: string;
    items: CategoryWithStats[];
    type: TransactionType;
  }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
              type === TransactionType.INCOME
                ? "bg-income/10 text-income"
                : "bg-expense/10 text-expense"
            )}
          >
            {title}
          </span>
          <span className="text-xs text-muted-foreground">{items.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="group rounded-xl border border-border bg-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                  }}
                >
                  {cat.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat._count.transactions} txn
                    {cat._count.transactions !== 1 ? "s" : ""}
                    {cat.totalAmount > 0 && (
                      <> · {formatCurrency(cat.totalAmount)}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setEditingId(cat.id)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <DeleteCategoryButton id={cat.id} transactionCount={cat._count.transactions} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Section title="Income" items={income} type={TransactionType.INCOME} />
      <Section title="Expenses" items={expense} type={TransactionType.EXPENSE} />

      {editingCat && (
        <EditCategoryDialog
          category={editingCat}
          open={!!editingId}
          onOpenChange={(o) => !o && setEditingId(null)}
        />
      )}
    </div>
  );
}