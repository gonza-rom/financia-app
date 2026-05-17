// src/features/categories/edit-category-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryFormData, CategoryWithStats } from "@/types";
import { updateCategoryAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#06b6d4", "#84cc16", "#a855f7",
];

interface EditCategoryDialogProps {
  category: CategoryWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch } = useForm<CategoryFormData>({
    defaultValues: {
      name: category.name,
      color: category.color,
      icon: category.icon,
      type: category.type,
    },
  });

  const selectedColor = watch("color");

  function onSubmit(data: CategoryFormData) {
    startTransition(async () => {
      const result = await updateCategoryAction(category.id, data);
      if (result.success) {
        toast({ title: "Category updated" });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-cat-name">Name</Label>
            <Input
              id="edit-cat-name"
              placeholder="e.g. Groceries"
              {...register("name", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}