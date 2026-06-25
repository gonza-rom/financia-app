"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Categoria, FormularioTransaccion, TransaccionConCategoria } from "@/types";
import { updateTransactionAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";

type CuentaSimple = {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
};

interface EditTransactionDialogProps {
  transaccion: TransaccionConCategoria;
  categorias: Categoria[];
  cuentas: CuentaSimple[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaccion,
  categorias,
  cuentas,
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
      cuentaId: transaccion.cuentaId ?? undefined,
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
          {/* Monto */}
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

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="edit-descripcion">Descripción</Label>
            <Input id="edit-descripcion" {...register("descripcion", { required: true })} />
          </div>

          {/* Categoría */}
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

          {/* Cuenta */}
          <div className="space-y-2">
            <Label>
              Cuenta <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Select
              defaultValue={transaccion.cuentaId ?? "ninguna"}
              onValueChange={(v) => setValue("cuentaId", v === "ninguna" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin cuenta específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin cuenta</SelectItem>
                {cuentas.map((cuenta) => (
                  <SelectItem key={cuenta.id} value={cuenta.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: cuenta.color }} />
                      {cuenta.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="edit-fecha">Fecha</Label>
            <Input
              id="edit-fecha"
              type="date"
              defaultValue={formatFechaInput(transaccion.fecha)}
              {...register("fecha", { setValueAs: parseFechaLocal })}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="edit-notas">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input id="edit-notas" placeholder="Alguna nota…" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
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