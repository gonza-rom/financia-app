// features/vehiculos/editar-gasto-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioGastoVehiculo, GastoVehiculoSerializado, SeccionConGastos } from "@/types/vehiculos";
import { actualizarGastoVehiculoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";

interface EditarGastoDialogProps {
  vehiculoId: string;
  seccion: SeccionConGastos;
  gasto: GastoVehiculoSerializado;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function detectarTipo(nombreSeccion: string) {
  const n = nombreSeccion.toLowerCase();
  if (n.includes("nafta") || n.includes("combustible") || n.includes("gnc")) return "combustible";
  if (n.includes("seguro")) return "seguro";
  if (n.includes("mantenimiento") || n.includes("service")) return "service";
  return "generico";
}

export function EditarGastoDialog({ vehiculoId, seccion, gasto, open, onOpenChange }: EditarGastoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const tipo = detectarTipo(seccion.nombre);

  const { register, handleSubmit, formState: { errors } } = useForm<FormularioGastoVehiculo>({
    defaultValues: {
      monto: gasto.monto,
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      notas: gasto.notas ?? "",
      kilometraje: gasto.kilometraje ?? undefined,
      litros: gasto.litros ?? undefined,
      precioPorUnidad: gasto.precioPorUnidad ?? undefined,
      vencimiento: gasto.vencimiento ?? undefined,
      proximoKm: gasto.proximoKm ?? undefined,
    },
  });

  function onSubmit(data: FormularioGastoVehiculo) {
    startTransition(async () => {
      const result = await actualizarGastoVehiculoAction(gasto.id, vehiculoId, data);
      if (result.success) {
        toast({ title: "Gasto actualizado" });
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
          <DialogTitle className="flex items-center gap-2">
            <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: seccion.color }} />
            Editar gasto en {seccion.nombre}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eg-monto">Monto</Label>
              <Input id="eg-monto" type="number" step="0.01" min="0.01" placeholder="0.00"
                {...register("monto", { required: true, valueAsNumber: true, min: 0.01 })}
                className={errors.monto ? "border-destructive" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eg-fecha">Fecha</Label>
              <Input
                id="eg-fecha"
                type="date"
                defaultValue={formatFechaInput(gasto.fecha)}
                {...register("fecha", { required: true, setValueAs: parseFechaLocal })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eg-desc">Descripción</Label>
            <Input id="eg-desc"
              {...register("descripcion", { required: true })}
              className={errors.descripcion ? "border-destructive" : ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eg-km">Kilometraje (opcional)</Label>
            <Input id="eg-km" type="number" placeholder="Km al momento del gasto"
              {...register("kilometraje", { valueAsNumber: true, min: 0 })} />
          </div>

          {tipo === "combustible" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="eg-litros">Litros</Label>
                <Input id="eg-litros" type="number" step="0.01" placeholder="0.00"
                  {...register("litros", { valueAsNumber: true, min: 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eg-precio">Precio por litro</Label>
                <Input id="eg-precio" type="number" step="0.01" placeholder="0.00"
                  {...register("precioPorUnidad", { valueAsNumber: true, min: 0 })} />
              </div>
            </div>
          )}

          {tipo === "seguro" && (
            <div className="space-y-2">
              <Label htmlFor="eg-venc">Vencimiento</Label>
              <Input
                id="eg-venc"
                type="date"
                defaultValue={gasto.vencimiento ? formatFechaInput(gasto.vencimiento) : ""}
                {...register("vencimiento", { setValueAs: parseFechaLocal })}
              />
            </div>
          )}

          {tipo === "service" && (
            <div className="space-y-2">
              <Label htmlFor="eg-proxkm">Próximo service (km)</Label>
              <Input id="eg-proxkm" type="number" placeholder="Ej: 20000"
                {...register("proximoKm", { valueAsNumber: true, min: 0 })} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="eg-notas">Notas (opcional)</Label>
            <Input id="eg-notas" placeholder="Alguna nota…" {...register("notas")} />
          </div>

          {gasto.transaccionId && (
            <p className="text-xs text-muted-foreground">
              Este gasto tiene una transacción personal vinculada — el monto, la fecha y la
              descripción se van a actualizar también ahí.
            </p>
          )}

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
