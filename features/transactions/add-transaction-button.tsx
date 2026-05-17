// features/transactions/add-transaction-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Categoria } from "@/types";
import { TransactionDialog } from "./transaction-dialog";

interface AddTransactionButtonProps {
  categorias: Categoria[];
}

export function AddTransactionButton({ categorias }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Nueva Transacción
      </Button>
      <TransactionDialog categorias={categorias} open={open} onOpenChange={setOpen} />
    </>
  );
}