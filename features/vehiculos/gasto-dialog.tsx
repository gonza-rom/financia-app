// features/vehiculos/gasto-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioGastoVehiculo, SeccionConGastos } from "@/types/vehiculos";
import { crearGastoVehiculoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface GastoDialogProps {
  vehiculoId: string;
  seccion: SeccionConGastos;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Campos extra según la sección
function camposExtra(nombreSeccion: string) {
  const n = nombreSeccion.toLowerCase();
  if (n.includes("nafta") || n.includes("combustible") || n.includes("gnc")) {
    return "combustible";
  }
  if (n.includes("seguro")) return "seguro";
  if (n.includes("mantenimiento") || n.includes("service")) return "service";
  return "generico";
}

export function GastoDialog({ vehiculoId, seccion, open, onOpenChange }: GastoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const tipo = camposExtra(seccion.nombre);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<FormularioGastoVehiculo>({
      defaultValues: { fecha: new Date() },
    });

  function onSubmit(data: FormularioGastoVehiculo) {
    startTransition(async () => {
      const result = await crearGastoVehiculoAction(vehiculoId, seccion.id, data);
      if (result.success) {
        toast({ title: "Gasto registrado" });
        reset();
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
          <DialogTitle>
            <span className="flex items-center gap-2">
              <span
                className="size-2 rounded-full inline-block"
                style={{ backgroundColor: seccion.color }}
              />
              Gasto en {seccion.nombre}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="g-monto">Monto</Label>
              <Input
                id="g-monto"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register("monto", { required: true, valueAsNumber: true, min: 0.01 })}
                className={errors.monto ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-fecha">Fecha</Label>
              <Input
                id="g-fecha"
                type="date"
                defaultValue={format(new Date(), "yyyy-MM-dd")}
                {...register("fecha", { required: true, setValueAs: (v) => new Date(v) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="g-desc">Descripción</Label>
            <Input
              id="g-desc"
              placeholder={
                tipo === "combustible" ? "Carga completa" :
                tipo === "seguro" ? "Cuota mensual" :
                tipo === "service" ? "Service 10.000 km" :
                "Descripción del gasto"
              }
              {...register("descripcion", { required: true })}
              className={errors.descripcion ? "border-destructive" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="g-km">Kilometraje (opcional)</Label>
            <Input
              id="g-km"
              type="number"
              placeholder="Km actuales"
              {...register("kilometraje", { valueAsNumber: true, min: 0 })}
            />
          </div>

          {/* Campos extra para combustible */}
          {tipo === "combustible" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="g-litros">Litros</Label>
                <Input
                  id="g-litros"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("litros", { valueAsNumber: true, min: 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-precio">Precio por litro</Label>
                <Input
                  id="g-precio"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("precioPorUnidad", { valueAsNumber: true, min: 0 })}
                />
              </div>
            </div>
          )}

          {/* Campos extra para seguro */}
          {tipo === "seguro" && (
            <div className="space-y-2">
              <Label htmlFor="g-venc">Vencimiento</Label>
              <Input
                id="g-venc"
                type="date"
                {...register("vencimiento", { setValueAs: (v) => v ? new Date(v) : undefined })}
              />
            </div>
          )}

          {/* Campos extra para service */}
          {tipo === "service" && (
            <div className="space-y-2">
              <Label htmlFor="g-proxkm">Próximo service (km)</Label>
              <Input
                id="g-proxkm"
                type="number"
                placeholder="Ej: 20000"
                {...register("proximoKm", { valueAsNumber: true, min: 0 })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="g-notas">Notas (opcional)</Label>
            <Input id="g-notas" placeholder="Alguna nota…" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Guardando…" : "Registrar gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}