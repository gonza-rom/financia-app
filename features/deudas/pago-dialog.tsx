// features/deudas/pago-dialog.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { registrarPagoDeuda } from "./actions";
import type { Deuda } from "@/types/deudas";

function fmt(n: number, moneda: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
}

interface PagoDialogProps {
  deuda: Deuda;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PagoDialog({ deuda, open, onOpenChange }: PagoDialogProps) {
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Normalizar montoPagado — puede llegar como undefined si la query es vieja
  const montoPagado = deuda.montoPagado ?? 0;
  const saldoPendiente = Math.max(0, deuda.montoTotal - montoPagado);
  const porcentajePagado = deuda.montoTotal > 0
    ? Math.min(100, (montoPagado / deuda.montoTotal) * 100)
    : 0;

  // Limpiar form cada vez que se abre
  useEffect(() => {
    if (open) {
      setMonto("");
      setNotas("");
    }
  }, [open]);

  function handleUsarSaldoCompleto() {
    setMonto(String(Math.round(saldoPendiente)));
  }

  function handleSubmit() {
    const montoNum = parseFloat(monto.replace(",", "."));

    if (isNaN(montoNum) || montoNum <= 0) {
      toast({ variant: "destructive", title: "Ingresá un monto válido." });
      return;
    }
    if (montoNum > saldoPendiente + 0.01) {
      toast({
        variant: "destructive",
        title: "Monto supera el saldo",
        description: `Saldo pendiente: ${fmt(saldoPendiente, deuda.moneda)}`,
      });
      return;
    }

    startTransition(async () => {
      const result = await registrarPagoDeuda(deuda.id, montoNum, notas.trim() || undefined);
      if (result.success) {
        toast({ title: "Pago registrado ✓" });
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
          <DialogTitle>Registrar pago parcial</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Resumen de la deuda */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground truncate mr-2">{deuda.contraparte}</span>
              {deuda.descripcion && (
                <span className="font-medium truncate text-right">{deuda.descripcion}</span>
              )}
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total</span>
              <span className="tabular-nums font-medium text-foreground">
                {fmt(deuda.montoTotal, deuda.moneda)}
              </span>
            </div>

            {montoPagado > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ya pagado</span>
                <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                  {fmt(montoPagado, deuda.moneda)}
                </span>
              </div>
            )}

            {/* Barra de progreso */}
            <Progress value={porcentajePagado} className="h-1.5" />

            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Saldo pendiente</span>
              <span className="tabular-nums text-rose-600 dark:text-rose-400">
                {fmt(saldoPendiente, deuda.moneda)}
              </span>
            </div>
          </div>

          {/* Monto a pagar */}
          <div className="space-y-1.5">
            <Label htmlFor="pago-monto">Monto a registrar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                {deuda.moneda}
              </span>
              <Input
                id="pago-monto"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="pl-12"
                disabled={isPending}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleUsarSaldoCompleto}
              className="text-xs text-primary hover:underline"
              disabled={isPending}
            >
              Usar saldo completo ({fmt(saldoPendiente, deuda.moneda)})
            </button>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="pago-notas">
              Notas{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="pago-notas"
              placeholder="ej. Transferencia 21/05"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !monto || saldoPendiente <= 0}
          >
            {isPending ? "Registrando…" : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}