// features/empresas/empresas-list.tsx
"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { EmpresaResumen } from "@/types/empresas";
import { formatCurrency } from "@/lib/utils";
import { Building2, ChevronRight, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eliminarEmpresaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { EditarEmpresaDialog } from "./editar-empresa-dialog";

function EmpresaCard({ empresa, moneda }: { empresa: EmpresaResumen; moneda: string }) {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const { toast } = useToast();

  function handleEliminar() {
    if (!confirm(`¿Eliminar "${empresa.nombre}"?`)) return;
    startTransition(async () => {
      const result = await eliminarEmpresaAction(empresa.id);
      if (!result.success) toast({ variant: "destructive", title: "Error", description: result.error });
      else toast({ title: "Empresa eliminada" });
    });
  }

  return (
    <>
      <div className="group rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1.5 w-full" style={{ backgroundColor: empresa.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ backgroundColor: `${empresa.color}20`, color: empresa.color }}
              >
                {empresa.logo ?? <Building2 className="size-5" />}
              </div>
              <div>
                <p className="font-semibold text-sm">{empresa.nombre}</p>
                {empresa.descripcion && (
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">{empresa.descripcion}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {empresa._count.clientes} cliente{empresa._count.clientes !== 1 ? "s" : ""} · {empresa._count.proyectos} proyecto{empresa._count.proyectos !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setEditando(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                onClick={handleEliminar} disabled={isPending}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="size-3" /> Ingresos
              </p>
              <p className="text-sm font-semibold text-income">{formatCurrency(empresa.totalIngresos, moneda)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingDown className="size-3" /> Gastos
              </p>
              <p className="text-sm font-semibold text-expense">{formatCurrency(empresa.totalGastos, moneda)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Neto</p>
              <p className={cn("text-sm font-semibold", empresa.gananciaNeta >= 0 ? "text-income" : "text-expense")}>
                {formatCurrency(empresa.gananciaNeta, moneda)}
              </p>
            </div>
          </div>

          <Link href={`/empresas/${empresa.id}`}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-medium transition-colors bg-primary/5 text-primary hover:bg-primary/10">
            Ver detalle <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {editando && (
        <EditarEmpresaDialog
          empresa={empresa}
          open={editando}
          onOpenChange={setEditando}
        />
      )}
    </>
  );
}

export function EmpresasList({ empresas, moneda }: { empresas: EmpresaResumen[]; moneda: string }) {
  if (empresas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Building2 className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">Sin empresas todavía</p>
        <p className="text-xs text-muted-foreground">Agregá tu primer negocio para empezar a trackear.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {empresas.map((e) => <EmpresaCard key={e.id} empresa={e} moneda={moneda} />)}
    </div>
  );
}