// features/empresas/editar-gasto-empresa-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GastoEmpresaSerializado } from "@/types/empresas";
import { actualizarGastoEmpresaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";

interface FormularioEdicion {
  descripcion: string;
  monto: number;
  fecha: Date;
  notas?: string;
}

export function EditarGastoEmpresaDialog({
  gasto, empresaId, open, onOpenChange,
}: {
  gasto: GastoEmpresaSerializado;
  empresaId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<FormularioEdicion>({
    defaultValues: {
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      notas: gasto.notas ?? "",
    },
  });

  function onSubmit(data: FormularioEdicion) {
    startTransition(async () => {
      const r = await actualizarGastoEmpresaAction(gasto.id, empresaId, data);
      if (r.success) { toast({ title: "Gasto actualizado" }); onOpenChange(false); }
      else toast({ variant: "destructive", title: "Error", description: r.error });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Editar gasto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input placeholder="Dominio, hosting, herramienta…"
              {...register("descripcion", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00"
                {...register("monto", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                defaultValue={formatFechaInput(gasto.fecha)}
                {...register("fecha", { setValueAs: parseFechaLocal })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input placeholder="Alguna nota…" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-1">
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
