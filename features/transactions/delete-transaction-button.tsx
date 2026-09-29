// features/transactions/delete-transaction-button.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransactionAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { confirmDialog } from "@/hooks/use-confirm";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  async function handleDelete() {
    const ok = await confirmDialog({ title: "¿Eliminar esta transacción?", destructive: true, confirmLabel: "Eliminar" });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteTransactionAction(id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Transacción eliminada" });
      }
    });
  }

  return (
    <Button variant="ghost" size="icon" className="size-9 sm:size-7 text-destructive hover:text-destructive"
      onClick={handleDelete} disabled={isPending}>
      <Trash2 className="size-3.5" />
    </Button>
  );
}