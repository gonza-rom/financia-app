// features/cuentas/nueva-cuenta-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormularioCuenta } from "@/types/cuentas";
import { TIPOS_CUENTA, COLORES_CUENTA } from "@/types/cuentas";
import { crearCuentaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NuevaCuentaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NuevaCuentaDialog({ open, onOpenChange }: NuevaCuentaDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<FormularioCuenta>({
      defaultValues: {
        tipo: "EFECTIVO",
        saldo: 0,
        color: COLORES_CUENTA[0],
        icono: "banknote",
      },
    });

  const tipoSeleccionado = watch("tipo");
  const colorSeleccionado = watch("color");

  function onSubmit(data: FormularioCuenta) {
    startTransition(async () => {
      const result = await crearCuentaAction(data);
      if (result.success) {
        toast({ title: "Cuenta creada" });
        reset();
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  function handleTipoChange(tipo: string) {
    const tipoData = TIPOS_CUENTA.find((t) => t.value === tipo);
    setValue("tipo", tipo as FormularioCuenta["tipo"]);
    if (tipoData) setValue("icono", tipoData.icono);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="ej. Mercado Pago, Efectivo, BBVA"
              {...register("nombre", { required: true })}
              className={errors.nombre ? "border-destructive" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de cuenta</Label>
            <Select value={tipoSeleccionado} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CUENTA.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldo">Saldo inicial</Label>
            <Input
              id="saldo"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("saldo", { required: true, valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES_CUENTA.map((color) => (
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Creando…" : "Crear cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}