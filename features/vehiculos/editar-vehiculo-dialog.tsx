// features/vehiculos/editar-vehiculo-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FormularioVehiculo, VehiculoResumen } from "@/types/vehiculos";
import { COLORES_SECCION } from "@/types/vehiculos";
import { actualizarVehiculoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface EditarVehiculoDialogProps {
  vehiculo: VehiculoResumen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarVehiculoDialog({ vehiculo, open, onOpenChange }: EditarVehiculoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch } = useForm<FormularioVehiculo>({
    defaultValues: {
      nombre: vehiculo.nombre,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      patente: vehiculo.patente ?? "",
      color: vehiculo.color,
      kilometraje: vehiculo.kilometraje ?? 0,
    },
  });

  const colorSeleccionado = watch("color");

  function onSubmit(data: FormularioVehiculo) {
    startTransition(async () => {
      const result = await actualizarVehiculoAction(vehiculo.id, data);
      if (result.success) {
        toast({ title: "Vehículo actualizado" });
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
          <DialogTitle>Editar vehículo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-nombre">Nombre</Label>
              <Input id="ev-nombre" {...register("nombre", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-patente">Patente</Label>
              <Input id="ev-patente" {...register("patente")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-marca">Marca</Label>
              <Input id="ev-marca" {...register("marca", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-modelo">Modelo</Label>
              <Input id="ev-modelo" {...register("modelo", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-anio">Año</Label>
              <Input
                id="ev-anio"
                type="number"
                {...register("anio", { required: true, valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-km">Kilometraje</Label>
            <Input
              id="ev-km"
              type="number"
              {...register("kilometraje", { valueAsNumber: true, min: 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES_SECCION.map((color) => (
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