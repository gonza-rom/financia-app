// features/vehiculos/gasto-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Categoria } from "@/types";
import type { FormularioGastoVehiculo, SeccionConGastos } from "@/types/vehiculos";
import { crearGastoVehiculoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";

interface GastoDialogProps {
  vehiculoId: string;
  seccion: SeccionConGastos;
  categorias: Categoria[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormData = FormularioGastoVehiculo & {
  registrarEnFinanzas?: boolean;
  categoriaId?: string;
};

function detectarTipo(nombreSeccion: string) {
  const n = nombreSeccion.toLowerCase();
  if (n.includes("nafta") || n.includes("combustible") || n.includes("gnc")) return "combustible";
  if (n.includes("seguro")) return "seguro";
  if (n.includes("mantenimiento") || n.includes("service")) return "service";
  return "generico";
}

export function GastoDialog({ vehiculoId, seccion, categorias, open, onOpenChange }: GastoDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const tipo = detectarTipo(seccion.nombre);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      fecha: new Date(),
      registrarEnFinanzas: false,
    },
  });

  const registrarEnFinanzas = watch("registrarEnFinanzas");
  const categoriasGasto = (categorias ?? []).filter((c) => c.tipo === "GASTO");

  function onSubmit(data: FormData) {
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
          <DialogTitle className="flex items-center gap-2">
            <span className="size-2 rounded-full inline-block shrink-0" style={{ backgroundColor: seccion.color }} />
            Gasto en {seccion.nombre}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Monto + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="g-monto">Monto</Label>
              <Input id="g-monto" type="number" step="0.01" min="0.01" placeholder="0.00"
                {...register("monto", { required: true, valueAsNumber: true, min: 0.01 })}
                className={errors.monto ? "border-destructive" : ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-fecha">Fecha</Label>
              <Input
                id="g-fecha"
                type="date"
                defaultValue={formatFechaInput(new Date())}
                {...register("fecha", { required: true, setValueAs: parseFechaLocal })}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="g-desc">Descripción</Label>
            <Input id="g-desc"
              placeholder={
                tipo === "combustible" ? "Carga completa" :
                tipo === "seguro" ? "Cuota mensual" :
                tipo === "service" ? "Service 10.000 km" :
                "Descripción del gasto"
              }
              {...register("descripcion", { required: true })}
              className={errors.descripcion ? "border-destructive" : ""} />
          </div>

          {/* Kilometraje */}
          <div className="space-y-2">
            <Label htmlFor="g-km">Kilometraje (opcional)</Label>
            <Input id="g-km" type="number" placeholder="Km actuales"
              {...register("kilometraje", { valueAsNumber: true, min: 0 })} />
          </div>

          {/* Extra: combustible */}
          {tipo === "combustible" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="g-litros">Litros</Label>
                <Input id="g-litros" type="number" step="0.01" placeholder="0.00"
                  {...register("litros", { valueAsNumber: true, min: 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-precio">Precio por litro</Label>
                <Input id="g-precio" type="number" step="0.01" placeholder="0.00"
                  {...register("precioPorUnidad", { valueAsNumber: true, min: 0 })} />
              </div>
            </div>
          )}

          {/* Extra: seguro — fecha de vencimiento también usa parseFechaLocal */}
          {tipo === "seguro" && (
            <div className="space-y-2">
              <Label htmlFor="g-venc">Vencimiento</Label>
              <Input
                id="g-venc"
                type="date"
                {...register("vencimiento", { setValueAs: parseFechaLocal })}
              />
            </div>
          )}

          {/* Extra: service */}
          {tipo === "service" && (
            <div className="space-y-2">
              <Label htmlFor="g-proxkm">Próximo service (km)</Label>
              <Input id="g-proxkm" type="number" placeholder="Ej: 20000"
                {...register("proximoKm", { valueAsNumber: true, min: 0 })} />
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="g-notas">Notas (opcional)</Label>
            <Input id="g-notas" placeholder="Alguna nota…" {...register("notas")} />
          </div>

          {/* Toggle registrar en finanzas */}
          <div
            className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer"
            onClick={() => setValue("registrarEnFinanzas", !registrarEnFinanzas)}
          >
            <div>
              <p className="text-sm font-medium">Registrar en finanzas</p>
              <p className="text-xs text-muted-foreground">Aparece en tus transacciones personales</p>
            </div>
            <div className={`relative w-9 h-5 rounded-full transition-colors ${registrarEnFinanzas ? "bg-primary" : "bg-muted"}`}>
              <div className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${registrarEnFinanzas ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </div>

          {registrarEnFinanzas && (
            <div className="space-y-2">
              <Label>Categoría de finanzas</Label>
              {categoriasGasto.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">
                  No tenés categorías de gasto. Creá una en la sección Categorías.
                </p>
              ) : (
                <Select onValueChange={(v) => setValue("categoriaId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasGasto.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          {cat.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Guardando…" : "Registrar gasto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}