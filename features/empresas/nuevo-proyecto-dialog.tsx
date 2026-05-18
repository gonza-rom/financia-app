// features/empresas/nuevo-proyecto-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormularioProyecto } from "@/types/empresas";
import type { Cliente } from "@/types/empresas";
import { crearProyectoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

const TIPOS = [
  { value: "UNICO", label: "Pago único" },
  { value: "HITOS", label: "Por hitos/cuotas" },
  { value: "SUSCRIPCION", label: "Suscripción mensual" },
  { value: "MIXTO", label: "Mixto" },
];

export function NuevoProyectoDialog({
  open, onOpenChange, empresaId, clientes,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  empresaId: string;
  clientes: Cliente[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { register, handleSubmit, reset, setValue } = useForm<FormularioProyecto>({
    defaultValues: { tipoCobro: "UNICO" },
  });

  function onSubmit(data: FormularioProyecto) {
    startTransition(async () => {
      const r = await crearProyectoAction(empresaId, data);
      if (r.success) { toast({ title: "Proyecto creado" }); reset(); onOpenChange(false); }
      else toast({ variant: "destructive", title: "Error", description: r.error });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Nuevo proyecto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input placeholder="Landing page para cliente X" {...register("nombre", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de cobro</Label>
              <Select defaultValue="UNICO" onValueChange={(v) => setValue("tipoCobro", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monto total (opcional)</Label>
              <Input type="number" step="0.01" placeholder="0.00"
                {...register("montoTotal", { valueAsNumber: true })} />
            </div>
          </div>
          {clientes.length > 0 && (
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select onValueChange={(v) => setValue("clienteId", v)}>
                <SelectTrigger><SelectValue placeholder="Sin cliente asignado" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Inicio (opcional)</Label>
              <Input type="date" {...register("fechaInicio", { setValueAs: (v) => v ? new Date(v) : undefined })} />
            </div>
            <div className="space-y-2">
              <Label>Fin estimado (opcional)</Label>
              <Input type="date" {...register("fechaFin", { setValueAs: (v) => v ? new Date(v) : undefined })} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Creando…" : "Crear proyecto"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}