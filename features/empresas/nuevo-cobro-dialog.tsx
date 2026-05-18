// features/empresas/nuevo-cobro-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioCobro } from "@/types/empresas";
import { crearCobroAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

export function NuevoCobroDialog({
  open, onOpenChange, proyectoId, empresaId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  proyectoId: string;
  empresaId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<FormularioCobro>();

  function onSubmit(data: FormularioCobro) {
    startTransition(async () => {
      const r = await crearCobroAction(proyectoId, empresaId, data);
      if (r.success) { toast({ title: "Cobro agregado" }); reset(); onOpenChange(false); }
      else toast({ variant: "destructive", title: "Error", description: r.error });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Agregar cobro</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input placeholder="Anticipo 50%, Cuota 1…" {...register("descripcion", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00"
                {...register("monto", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha estimada</Label>
              <Input type="date" defaultValue={format(new Date(), "yyyy-MM-dd")}
                {...register("fechaEstimada", { setValueAs: (v) => v ? new Date(v) : undefined })} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Guardando…" : "Agregar cobro"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}