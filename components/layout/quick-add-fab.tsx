// components/layout/quick-add-fab.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TransactionDialog } from "@/features/transactions/transaction-dialog";
import type { Categoria } from "@/types";

type CuentaSimple = {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
};

interface QuickAddFabProps {
  categorias: Categoria[];
  cuentas: CuentaSimple[];
}

// Botón flotante para cargar una transacción desde cualquier pantalla — solo en
// desktop, donde no hay una tab bar donde incrustarlo (en mobile vive dentro de
// MobileNav, como un botón central sobresaliendo de la barra).
export function QuickAddFab({ categorias, cuentas }: QuickAddFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Nueva transacción"
        title="Nueva transacción"
        className="
          hidden md:flex
          fixed z-40 right-6 bottom-6
          size-14 rounded-full
          bg-primary text-primary-foreground
          shadow-lg shadow-primary/25
          items-center justify-center
          transition-transform hover:scale-105 active:scale-95
        "
      >
        <Plus className="size-6" />
      </button>

      <TransactionDialog categorias={categorias} cuentas={cuentas} open={open} onOpenChange={setOpen} />
    </>
  );
}
