// features/empresas/editar-proyecto-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormularioProyecto, ProyectoConCobros, Cliente } from "@/types/empresas";
import { actualizarProyectoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

const TIPOS = [
  { value: "UNICO",       label: "Pago único" },
  { value: "HITOS",       label: "Por hitos/cuotas" },
  { value: "SUSCRIPCION", label: "Suscripción mensual" },
  { value: "MIXTO",       label: "Mixto" },
];

const ESTADOS = [
  { value: "ACTIVO",      label: "Activo" },
  { value: "PAUSADO",     label: "Pausado" },
  { value: "COMPLETADO",  label: "Completado" },
  { value: "CANCELADO",   label: "Cancelado" },
];

interface EditarProyectoDialogProps {
  proyecto: ProyectoConCobros;
  empresaId: string;
  clientes: Cliente[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EditarProyectoDialog({
  proyecto, empresaId, clientes, open, onOpenChange,
}: EditarProyectoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue } = useForm<FormularioProyecto & { estado: string }>({
    defaultValues: {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion ?? "",
      tipoCobro: proyecto.tipoCobro,
      montoTotal: proyecto.montoTotal ?? undefined,
      clienteId: proyecto.clienteId ?? undefined,
      fechaInicio: proyecto.fechaInicio ?? undefined,
      fechaFin: proyecto.fechaFin ?? undefined,
      estado: proyecto.estado,
    },
  });

  function onSubmit(data: FormularioProyecto & { estado: string }) {
    startTransition(async () => {
      const result = await actualizarProyectoAction(proyecto.id, empresaId, {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        tipoCobro: data.tipoCobro,
        montoTotal: data.montoTotal,
        clienteId: data.clienteId || undefined,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        estado: data.estado,
      });
      if (result.success) {
        toast({ title: "Proyecto actualizado" });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Editar proyecto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input placeholder="Landing page para cliente X" {...register("nombre", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input placeholder="Descripción del proyecto…" {...register("descripcion")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de cobro</Label>
              <Select defaultValue={proyecto.tipoCobro} onValueChange={(v) => setValue("tipoCobro", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select defaultValue={proyecto.estado} onValueChange={(v) => setValue("estado", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monto total (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("montoTotal", { valueAsNumber: true })}
            />
          </div>

          {clientes.length > 0 && (
            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Select
                defaultValue={proyecto.clienteId ?? "ninguno"}
                onValueChange={(v) => setValue("clienteId", v === "ninguno" ? undefined : v)}
              >
                <SelectTrigger><SelectValue placeholder="Sin cliente asignado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin cliente</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Inicio (opcional)</Label>
              <Input
                type="date"
                defaultValue={proyecto.fechaInicio ? format(new Date(proyecto.fechaInicio), "yyyy-MM-dd") : ""}
                {...register("fechaInicio", { setValueAs: (v) => v ? new Date(v) : undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin estimado (opcional)</Label>
              <Input
                type="date"
                defaultValue={proyecto.fechaFin ? format(new Date(proyecto.fechaFin), "yyyy-MM-dd") : ""}
                {...register("fechaFin", { setValueAs: (v) => v ? new Date(v) : undefined })}
              />
            </div>
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