"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Categoria } from "@/types";
import { TransactionDialog } from "./transaction-dialog";

type CuentaSimple = {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
};

interface AddTransactionButtonProps {
  categorias: Categoria[];
  cuentas: CuentaSimple[];
}

export function AddTransactionButton({ categorias, cuentas }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Nueva Transacción
      </Button>
      <TransactionDialog categorias={categorias} cuentas={cuentas} open={open} onOpenChange={setOpen} />
    </>
  );
}