// features/vehiculos/editar-seccion-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FormularioSeccion, SeccionConGastos } from "@/types/vehiculos";
import { COLORES_SECCION } from "@/types/vehiculos";
import { actualizarSeccionAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface EditarSeccionDialogProps {
  vehiculoId: string;
  seccion: SeccionConGastos;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarSeccionDialog({ vehiculoId, seccion, open, onOpenChange }: EditarSeccionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormularioSeccion>({
      defaultValues: { nombre: seccion.nombre, color: seccion.color, icono: seccion.icono },
    });

  const colorSeleccionado = watch("color");

  function onSubmit(data: FormularioSeccion) {
    startTransition(async () => {
      const result = await actualizarSeccionAction(seccion.id, vehiculoId, data);
      if (result.success) {
        toast({ title: "Sección actualizada" });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar sección</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="es-nombre">Nombre</Label>
            <Input
              id="es-nombre"
              placeholder="ej. Nafta, Seguro, GNC…"
              {...register("nombre", { required: true })}
              className={errors.nombre ? "border-destructive" : ""}
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
