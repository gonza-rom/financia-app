// features/categories/edit-category-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioCategoria, CategoriaConEstadisticas } from "@/types";
import { updateCategoryAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COLORES_PRESET = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#06b6d4", "#84cc16", "#a855f7",
];

interface EditarCategoriaDialogProps {
  categoria: CategoriaConEstadisticas;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ categoria, open, onOpenChange }: EditarCategoriaDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch } = useForm<FormularioCategoria>({
    defaultValues: {
      nombre: categoria.nombre,
      color: categoria.color,
      icono: categoria.icono,
      tipo: categoria.tipo,
    },
  });

  const colorSeleccionado = watch("color");

  function onSubmit(data: FormularioCategoria) {
    startTransition(async () => {
      const result = await updateCategoryAction(categoria.id, data);
      if (result.success) {
        toast({ title: "Categoría actualizada" });
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
          <DialogTitle>Editar categoría</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-cat-nombre">Nombre</Label>
            <Input
              id="edit-cat-nombre"
              placeholder="ej. Supermercado"
              {...register("nombre", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES_PRESET.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    colorSeleccionado === color ? "border-foreground scale-110" : "border-transparent"
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
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}