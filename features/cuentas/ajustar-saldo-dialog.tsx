"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { ajustarSaldoCuentaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import type { CuentaConStats } from "@/types/cuentas";

interface AjustarSaldoDialogProps {
  cuenta: CuentaConStats;
  moneda: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AjustarSaldoDialog({ cuenta, moneda, open, onOpenChange }: AjustarSaldoDialogProps) {
  const [nuevoSaldo, setNuevoSaldo] = useState(String(Number(cuenta.saldo)));
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const saldoActual = Number(cuenta.saldo);
  const saldoNuevo = parseFloat(nuevoSaldo.replace(",", "."));
  const diferencia = isNaN(saldoNuevo) ? 0 : saldoNuevo - saldoActual;

  function handleConfirmar() {
    if (isNaN(saldoNuevo)) {
      toast({ variant: "destructive", title: "Ingresá un saldo válido." });
      return;
    }

    startTransition(async () => {
      const result = await ajustarSaldoCuentaAction(cuenta.id, saldoNuevo);
      if (result.success) {
        toast({ title: "Saldo ajustado ✓" });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar saldo — {cuenta.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Saldo actual */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo actual</span>
              <span className="font-medium tabular-nums">{formatCurrency(saldoActual, moneda)}</span>
            </div>
            {!isNaN(saldoNuevo) && diferencia !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diferencia</span>
                <span className={diferencia > 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                  {diferencia > 0 ? "+" : ""}{formatCurrency(diferencia, moneda)}
                </span>
              </div>
            )}
          </div>

          {/* Nuevo saldo */}
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-saldo">Nuevo saldo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                {moneda}
              </span>
              <Input
                id="nuevo-saldo"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={nuevoSaldo}
                onChange={(e) => setNuevoSaldo(e.target.value)}
                className="pl-12"
                disabled={isPending}
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Este ajuste no genera una transacción. Usalo para correcciones manuales.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={isPending || isNaN(saldoNuevo)}>
            {isPending ? "Ajustando…" : "Confirmar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}