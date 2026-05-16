// src/features/categories/delete-category-button.tsx
"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface DeleteCategoryButtonProps {
  id: string;
  transactionCount: number;
}

export function DeleteCategoryButton({ id, transactionCount }: DeleteCategoryButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleDelete() {
    if (transactionCount > 0) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: `This category has ${transactionCount} transaction(s). Reassign them first.`,
      });
      return;
    }
    if (!confirm("Delete this category?")) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Category deleted" });
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