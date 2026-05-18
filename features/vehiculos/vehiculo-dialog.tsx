// features/vehiculos/vehiculo-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FormularioVehiculo } from "@/types/vehiculos";
import { COLORES_SECCION } from "@/types/vehiculos";
import { crearVehiculoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface VehiculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehiculoDialog({ open, onOpenChange }: VehiculoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<FormularioVehiculo>({
      defaultValues: { color: "#3b82f6", kilometraje: 0 },
    });

  const colorSeleccionado = watch("color");

  function onSubmit(data: FormularioVehiculo) {
    startTransition(async () => {
      const result = await crearVehiculoAction(data, true);
      if (result.success) {
        toast({ title: "Vehículo creado" });
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
          <DialogTitle>Nuevo vehículo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="v-nombre">Nombre</Label>
              <Input
                id="v-nombre"
                placeholder="Mi Corsa"
                {...register("nombre", { required: true })}
                className={errors.nombre ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-patente">Patente</Label>
              <Input
                id="v-patente"
                placeholder="ABC 123"
                {...register("patente")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="v-marca">Marca</Label>
              <Input
                id="v-marca"
                placeholder="Chevrolet"
                {...register("marca", { required: true })}
                className={errors.marca ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-modelo">Modelo</Label>
              <Input
                id="v-modelo"
                placeholder="Corsa"
                {...register("modelo", { required: true })}
                className={errors.modelo ? "border-destructive" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-anio">Año</Label>
              <Input
                id="v-anio"
                type="number"
                placeholder="2020"
                {...register("anio", { required: true, valueAsNumber: true, min: 1900, max: new Date().getFullYear() + 1 })}
                className={errors.anio ? "border-destructive" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="v-km">Kilometraje actual</Label>
            <Input
              id="v-km"
              type="number"
              placeholder="0"
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

          <p className="text-xs text-muted-foreground">
            Se crearán automáticamente las secciones: Nafta, Seguro, Mantenimiento y GNC.
          </p>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Creando…" : "Crear vehículo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}