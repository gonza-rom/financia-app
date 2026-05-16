// src/features/transactions/add-transaction-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types";
import { TransactionDialog } from "./transaction-dialog";

interface AddTransactionButtonProps {
  categories: Category[];
}

export function AddTransactionButton({ categories }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Add Transaction
      </Button>
      <TransactionDialog
        categories={categories}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}