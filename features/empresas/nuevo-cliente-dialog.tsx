// features/empresas/nuevo-cliente-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioCliente } from "@/types/empresas";
import { crearClienteAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

export function NuevoClienteDialog({
  open, onOpenChange, empresaId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  empresaId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<FormularioCliente>();

  function onSubmit(data: FormularioCliente) {
    startTransition(async () => {
      const r = await crearClienteAction(empresaId, data);
      if (r.success) { toast({ title: "Cliente agregado" }); reset(); onOpenChange(false); }
      else toast({ variant: "destructive", title: "Error", description: r.error });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Nuevo cliente</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input placeholder="Empresa S.A." {...register("nombre", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Email (opcional)</Label>
            <Input type="email" placeholder="contacto@empresa.com" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Teléfono (opcional)</Label>
            <Input placeholder="+54 9 11…" {...register("telefono")} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Guardando…" : "Agregar cliente"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}