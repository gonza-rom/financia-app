// src/features/transactions/transaction-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Category } from "@/types";
import { TransactionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TransactionFiltersBarProps {
  categories: Category[];
}

export function TransactionFiltersBar({ categories }: TransactionFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const activeType = searchParams.get("type") as TransactionType | null;
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Type filter */}
      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
        <button
          onClick={() => updateParam("type", null)}
          className={cn(
            "px-3 py-1.5 transition-colors",
            !activeType ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          onClick={() => updateParam("type", TransactionType.INCOME)}
          className={cn(
            "px-3 py-1.5 transition-colors border-l border-border",
            activeType === TransactionType.INCOME
              ? "bg-income/10 text-income"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Income
        </button>
        <button
          onClick={() => updateParam("type", TransactionType.EXPENSE)}
          className={cn(
            "px-3 py-1.5 transition-colors border-l border-border",
            activeType === TransactionType.EXPENSE
              ? "bg-expense/10 text-expense"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Expenses
        </button>
      </div>

      {/* Category filter */}
      <Select
        value={searchParams.get("categoryId") ?? "all"}
        onValueChange={(v) => updateParam("categoryId", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <Input
        placeholder="Search…"
        className="h-8 text-sm w-[160px]"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          const timeout = setTimeout(() => updateParam("search", val || null), 400);
          return () => clearTimeout(timeout);
        }}
      />

      {/* Clear */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground"
          onClick={() => router.push("?")}
        >
          <X className="size-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}