"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Categoria, FormularioTransaccion } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { createTransactionAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";

type CuentaSimple = {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
};

interface TransactionDialogProps {
  categorias: Categoria[];
  cuentas: CuentaSimple[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDialog({ categorias, cuentas, open, onOpenChange }: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormularioTransaccion>({
    defaultValues: {
      tipo: TipoTransaccion.GASTO,
      fecha: new Date(),
      esRecurrente: false,
      cuentaId: undefined,
    },
  });

  const tipoSeleccionado = watch("tipo");
  const categoriasFiltradas = categorias.filter((c) => c.tipo === tipoSeleccionado);

  function onSubmit(data: FormularioTransaccion) {
    startTransition(async () => {
      const result = await createTransactionAction(data);
      if (result.success) {
        toast({ title: "Transacción agregada" });
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
          <DialogTitle>Nueva Transacción</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Tipo */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {[TipoTransaccion.GASTO, TipoTransaccion.INGRESO].map((t) => (
              <button key={t} type="button" onClick={() => setValue("tipo", t)}
                className={cn("flex-1 py-2 text-sm font-medium transition-colors",
                  tipoSeleccionado === t
                    ? t === TipoTransaccion.INGRESO ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {t === TipoTransaccion.INGRESO ? "Ingreso" : "Gasto"}
              </button>
            ))}
          </div>

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto</Label>
            <Input id="monto" type="number" step="0.01" min="0.01" placeholder="0.00"
              {...register("monto", { required: true, valueAsNumber: true, min: 0.01 })}
              className={errors.monto ? "border-destructive" : ""} />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" placeholder="¿Para qué fue?"
              {...register("descripcion", { required: true })}
              className={errors.descripcion ? "border-destructive" : ""} />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select onValueChange={(v) => setValue("categoriaId", v)}>
              <SelectTrigger className={errors.categoriaId ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Sin categorías para este tipo</div>
                ) : (
                  categoriasFiltradas.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.nombre}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Cuenta */}
          <div className="space-y-2">
            <Label>
              Cuenta <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Select onValueChange={(v) => setValue("cuentaId", v === "ninguna" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cuenta específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin cuenta</SelectItem>
                {cuentas.map((cuenta) => (
                  <SelectItem key={cuenta.id} value={cuenta.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: cuenta.color }} />
                      {cuenta.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              defaultValue={formatFechaInput(new Date())}
              {...register("fecha", { required: true, setValueAs: parseFechaLocal })}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input id="notas" placeholder="Alguna nota…" {...register("notas")} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Guardando…" : "Guardar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}