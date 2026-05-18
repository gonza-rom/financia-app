// features/empresas/empresa-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FormularioEmpresa } from "@/types/empresas";
import { crearEmpresaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

const COLORES = ["#3b82f6","#22c55e","#f97316","#ef4444","#8b5cf6","#f59e0b","#14b8a6","#ec4899","#6b7280","#06b6d4"];
const MONEDAS = ["ARS","USD","EUR","BRL","CLP","MXN"];

export function EmpresaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormularioEmpresa>({
    defaultValues: { color: "#3b82f6", moneda: "ARS" },
  });
  const colorSeleccionado = watch("color");

  function onSubmit(data: FormularioEmpresa) {
    startTransition(async () => {
      const result = await crearEmpresaAction(data);
      if (result.success) {
        toast({ title: "Empresa creada" });
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
        <DialogHeader><DialogTitle>Nueva empresa</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input placeholder="DevHub Software" {...register("nombre", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Emoji / Logo</Label>
              <Input placeholder="🚀" {...register("logo")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input placeholder="Software a medida…" {...register("descripcion")} />
          </div>
          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select defaultValue="ARS" onValueChange={(v) => setValue("moneda", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((color) => (
                <button key={color} type="button" onClick={() => setValue("color", color)}
                  className={cn("size-7 rounded-full border-2 transition-transform hover:scale-110",
                    colorSeleccionado === color ? "border-foreground scale-110" : "border-transparent")}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Creando…" : "Crear empresa"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}