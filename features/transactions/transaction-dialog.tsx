// src/features/transactions/transaction-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, TransactionFormData } from "@/types";
import { TransactionType } from "@prisma/client";
import { createTransactionAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TransactionDialogProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDialog({ categories, open, onOpenChange }: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: {
      type: TransactionType.EXPENSE,
      date: new Date(),
      isRecurring: false,
    },
  });

  const selectedType = watch("type");

  const filteredCategories = categories.filter((c) => c.type === selectedType);

  function onSubmit(data: TransactionFormData) {
    startTransition(async () => {
      const result = await createTransactionAction(data);
      if (result.success) {
        toast({ title: "Transaction added" });
        reset();
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Type toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {[TransactionType.EXPENSE, TransactionType.INCOME].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  selectedType === t
                    ? t === TransactionType.INCOME
                      ? "bg-income/10 text-income"
                      : "bg-expense/10 text-expense"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === TransactionType.INCOME ? "Income" : "Expense"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("amount", { required: true, valueAsNumber: true, min: 0.01 })}
              className={errors.amount ? "border-destructive" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              {...register("description", { required: true })}
              className={errors.description ? "border-destructive" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select onValueChange={(v) => setValue("categoryId", v)}>
              <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No categories for this type
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              {...register("date", {
                required: true,
                setValueAs: (v) => new Date(v),
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input id="notes" placeholder="Any notes…" {...register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}