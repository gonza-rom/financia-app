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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { registrarPagoDeuda } from "./actions";
import type { Deuda } from "@/types/deudas";
import type { Categoria } from "@/types";

function fmt(n: number, moneda: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: moneda, maximumFractionDigits: 0,
  }).format(n);
}

interface PagoDialogProps {
  deuda: Deuda;
  categorias: Categoria[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PagoDialog({ deuda, categorias = [], open, onOpenChange }: PagoDialogProps) {
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const montoPagado = deuda.montoPagado ?? 0;
  const saldoPendiente = Math.max(0, deuda.montoTotal - montoPagado);
  const porcentajePagado = deuda.montoTotal > 0
    ? Math.min(100, (montoPagado / deuda.montoTotal) * 100) : 0;

  // Categorías relevantes según tipo de deuda
  const categoriasRelevantes = categorias.filter((c) =>
   deuda.tipo === "cobrar" ? c.tipo === "INGRESO" : c.tipo === "GASTO"
  );

  useEffect(() => {
    if (open) {
      setMonto("");
      setNotas("");
      setCategoriaId(undefined);
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
      const result = await registrarPagoDeuda(
        deuda.id,
        montoNum,
        notas.trim() || undefined,
        categoriaId,
      );
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
          {/* Resumen */}
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
            <Progress value={porcentajePagado} className="h-1.5" />
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Saldo pendiente</span>
              <span className="tabular-nums text-rose-600 dark:text-rose-400">
                {fmt(saldoPendiente, deuda.moneda)}
              </span>
            </div>
          </div>

          {/* Monto */}
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
              Notas <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="pago-notas"
              placeholder="ej. Transferencia 21/05"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Categoría para registrar en finanzas */}
          <div className="space-y-1.5">
            <Label>
              Registrar en finanzas{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            {categoriasRelevantes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tenés categorías de {deuda.tipo === "cobrar" ? "ingreso" : "gasto"}.
                Creá una en la sección Categorías.
              </p>
            ) : (
              <Select
                value={categoriaId ?? "ninguna"}
                onValueChange={(v) => setCategoriaId(v === "ninguna" ? undefined : v)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Sin categoría (no registra transacción)</SelectItem>
                  {categoriasRelevantes.map((cat) => (
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
            {categoriaId && monto && !isNaN(parseFloat(monto)) && (
              <p className="text-xs text-muted-foreground">
                Se creará una transacción de{" "}
                <span className="font-medium">{fmt(parseFloat(monto), deuda.moneda)}</span>{" "}
                en tu historial.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !monto || saldoPendiente <= 0}>
            {isPending ? "Registrando…" : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}