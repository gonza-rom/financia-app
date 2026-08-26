// features/empresas/editar-cobro-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioCobro, CobroSerializado } from "@/types/empresas";
import { actualizarCobroAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";

export function EditarCobroDialog({
  cobro, empresaId, open, onOpenChange,
}: {
  cobro: CobroSerializado;
  empresaId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<FormularioCobro>({
    defaultValues: {
      descripcion: cobro.descripcion,
      monto: cobro.monto,
      fechaEstimada: cobro.fechaEstimada ?? undefined,
    },
  });

  function onSubmit(data: FormularioCobro) {
    startTransition(async () => {
      const r = await actualizarCobroAction(cobro.id, empresaId, data);
      if (r.success) { toast({ title: "Cobro actualizado" }); onOpenChange(false); }
      else toast({ variant: "destructive", title: "Error", description: r.error });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Editar cobro</DialogTitle></DialogHeader>
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
              <Input
                type="date"
                defaultValue={cobro.fechaEstimada ? formatFechaInput(cobro.fechaEstimada) : ""}
                {...register("fechaEstimada", { setValueAs: parseFechaLocal })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Guardando…" : "Guardar cambios"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
