// features/cuentas/transferencias-list.tsx
"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";
import { eliminarTransferenciaAction, actualizarTransferenciaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { confirmDialog } from "@/hooks/use-confirm";
import type { TransferenciaConCuentas } from "@/types/cuentas";

function EditarTransferenciaDialog({
  transferencia, open, onOpenChange,
}: {
  transferencia: TransferenciaConCuentas;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fecha, setFecha] = useState(formatFechaInput(transferencia.fecha));
  const [descripcion, setDescripcion] = useState(transferencia.descripcion ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleGuardar() {
    startTransition(async () => {
      const result = await actualizarTransferenciaAction(transferencia.id, {
        fecha: parseFechaLocal(fecha),
        descripcion,
      });
      if (result.success) {
        toast({ title: "Transferencia actualizada" });
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
          <DialogTitle>Editar transferencia</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground">
            El monto y las cuentas no se pueden editar — si te equivocaste en eso, eliminá la
            transferencia y cargala de nuevo.
          </p>
          <div className="space-y-2">
            <Label htmlFor="edit-transf-fecha">Fecha</Label>
            <Input id="edit-transf-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-transf-desc">Descripción</Label>
            <Input id="edit-transf-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleGuardar} disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransferenciaRow({ transferencia, moneda }: { transferencia: TransferenciaConCuentas; moneda: string }) {
  const [editarOpen, setEditarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  async function handleEliminar() {
    const ok = await confirmDialog({
      title: "¿Eliminar esta transferencia?",
      description: "El monto vuelve a la cuenta de origen y sale de la de destino.",
      destructive: true,
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await eliminarTransferenciaAction(transferencia.id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Transferencia eliminada" });
      }
    });
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 group flex-wrap sm:flex-nowrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: transferencia.cuentaOrigen.color }} />
            {transferencia.cuentaOrigen.nombre}
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
          <span className="flex items-center gap-1.5 truncate">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: transferencia.cuentaDestino.color }} />
            {transferencia.cuentaDestino.nombre}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatShortDate(transferencia.fecha)}
          {transferencia.descripcion && <> · {transferencia.descripcion}</>}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <p className="text-sm font-semibold tabular-nums">{formatCurrency(transferencia.monto, moneda)}</p>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-9 sm:size-7" onClick={() => setEditarOpen(true)} title="Editar">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 sm:size-7 text-destructive hover:text-destructive"
            onClick={handleEliminar}
            disabled={isPending}
            title="Eliminar"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {editarOpen && (
        <EditarTransferenciaDialog transferencia={transferencia} open={editarOpen} onOpenChange={setEditarOpen} />
      )}
    </div>
  );
}

export function TransferenciasList({
  transferencias, moneda,
}: {
  transferencias: TransferenciaConCuentas[];
  moneda: string;
}) {
  if (transferencias.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Transferencias recientes</h2>
      </div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {transferencias.map((t) => (
          <TransferenciaRow key={t.id} transferencia={t} moneda={moneda} />
        ))}
      </div>
    </div>
  );
}
