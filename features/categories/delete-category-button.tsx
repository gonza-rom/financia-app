// features/categories/delete-category-button.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface DeleteCategoryButtonProps {
  id: string;
  cantidadTransacciones: number;
}

export function DeleteCategoryButton({ id, cantidadTransacciones }: DeleteCategoryButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete() {
    if (cantidadTransacciones > 0) {
      toast({
        variant: "destructive",
        title: "No se puede eliminar",
        description: `Esta categoría tiene ${cantidadTransacciones} transacción${cantidadTransacciones !== 1 ? "es" : ""}. Reasignala primero.`,
      });
      return;
    }
    if (!confirm("¿Eliminar esta categoría?")) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Categoría eliminada" });
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}