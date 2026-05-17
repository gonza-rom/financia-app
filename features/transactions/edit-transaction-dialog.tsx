// src/features/transactions/edit-transaction-dialog.tsx
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
import type { Categoria, FormularioTransaccion, TransaccionConCategoria } from "@/types";
import { updateTransactionAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface EditTransactionDialogProps {
  transaccion: TransaccionConCategoria;
  categorias: Categoria[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaccion,
  categorias,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue } = useForm<FormularioTransaccion>({
    defaultValues: {
      monto: Number(transaccion.monto),
      descripcion: transaccion.descripcion,
      tipo: transaccion.tipo,
      fecha: transaccion.fecha,
      categoriaId: transaccion.categoriaId,
      notas: transaccion.notas ?? "",
      esRecurrente: transaccion.esRecurrente,
    },
  });

  const categoriasFiltradas = categorias.filter((c) => c.tipo === transaccion.tipo);

  function onSubmit(data: FormularioTransaccion) {
    startTransition(async () => {
      const result = await updateTransactionAction(transaccion.id, data);
      if (result.success) {
        toast({ title: "Transacción actualizada" });
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
          <DialogTitle>Editar transacción</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-monto">Monto</Label>
            <Input
              id="edit-monto"
              type="number"
              step="0.01"
              min="0.01"
              {...register("monto", { required: true, valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descripcion">Descripción</Label>
            <Input
              id="edit-descripcion"
              {...register("descripcion", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              defaultValue={transaccion.categoriaId}
              onValueChange={(v) => setValue("categoriaId", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-fecha">Fecha</Label>
            <Input
              id="edit-fecha"
              type="date"
              defaultValue={format(new Date(transaccion.fecha), "yyyy-MM-dd")}
              {...register("fecha", { setValueAs: (v) => new Date(v) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notas">Notas</Label>
            <Input id="edit-notas" placeholder="Alguna nota…" {...register("notas")} />
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