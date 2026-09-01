// features/empresas/nuevo-gasto-empresa-dialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormularioGastoEmpresa } from "@/types/empresas";
import type { Categoria } from "@/types";
import { crearGastoEmpresaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";
import { CategoriaCombobox } from "@/features/categories/categoria-combobox";
import { CuentaSelect, type CuentaSimple } from "@/features/cuentas/cuenta-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProyectoSimple {
  id: string;
  nombre: string;
}

export function NuevoGastoEmpresaDialog({
  open, onOpenChange, empresaId, categorias, cuentas, moneda, proyectos = [], proyectoIdInicial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  empresaId: string;
  categorias: Categoria[];
  cuentas: CuentaSimple[];
  moneda: string;
  proyectos?: ProyectoSimple[];
  proyectoIdInicial?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [transferir, setTransferir] = useState(false);
  const [categoriaId, setCategoriaId] = useState("");
  const [cuentaId, setCuentaId] = useState<string | null | undefined>();
  const [proyectoId, setProyectoId] = useState<string | undefined>(proyectoIdInicial);
  const { toast } = useToast();

  const { register, handleSubmit, reset } = useForm<FormularioGastoEmpresa>({
    defaultValues: { fecha: new Date() },
  });

  function onSubmit(data: FormularioGastoEmpresa) {
    startTransition(async () => {
      const r = await crearGastoEmpresaAction(
        empresaId,
        { ...data, transferirAPersonal: transferir, cuentaId: transferir ? cuentaId : undefined, proyectoId },
        transferir ? categoriaId : undefined
      );
      if (r.success) {
        toast({ title: "Gasto registrado" });
        reset();
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: r.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Gasto de empresa</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input placeholder="Dominio, hosting, herramienta…"
              {...register("descripcion", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00"
                {...register("monto", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                defaultValue={formatFechaInput(new Date())}
                {...register("fecha", { setValueAs: parseFechaLocal })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input placeholder="Alguna nota…" {...register("notas")} />
          </div>

          {proyectoIdInicial ? (
            <p className="text-xs text-muted-foreground">
              Este gasto se va a asociar al proyecto{" "}
              <span className="font-medium text-foreground">
                {proyectos.find((p) => p.id === proyectoIdInicial)?.nombre ?? ""}
              </span>.
            </p>
          ) : proyectos.length > 0 && (
            <div className="space-y-2">
              <Label>Proyecto <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Select
                value={proyectoId ?? "ninguno"}
                onValueChange={(v) => setProyectoId(v === "ninguno" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gasto general de la empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Gasto general (sin proyecto)</SelectItem>
                  {proyectos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <input type="checkbox" id="transferir-gasto" checked={transferir}
              onChange={(e) => setTransferir(e.target.checked)} className="rounded" />
            <label htmlFor="transferir-gasto" className="text-sm">
              Reflejar en finanzas personales
            </label>
          </div>

          {transferir && (
            <>
              <CategoriaCombobox
                categorias={categorias.filter((c) => c.tipo === "GASTO")}
                value={categoriaId}
                onChange={setCategoriaId}
                placeholder="Categoría de gasto personal"
              />
              <CuentaSelect cuentas={cuentas} value={cuentaId} onChange={setCuentaId} />
            </>
          )}

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