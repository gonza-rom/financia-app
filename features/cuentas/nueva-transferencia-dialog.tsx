// features/cuentas/nueva-transferencia-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { parseFechaLocal, formatFechaInput } from "@/lib/utils-fecha";
import { transferirEntreCuentasAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import type { CuentaConStats } from "@/types/cuentas";

interface NuevaTransferenciaButtonProps {
  cuentas: CuentaConStats[];
  moneda: string;
}

export function NuevaTransferenciaButton({ cuentas, moneda }: NuevaTransferenciaButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ArrowRightLeft className="size-4 mr-1.5" />
        Transferir
      </Button>
      <NuevaTransferenciaDialog cuentas={cuentas} moneda={moneda} open={open} onOpenChange={setOpen} />
    </>
  );
}

function NuevaTransferenciaDialog({
  cuentas, moneda, open, onOpenChange,
}: {
  cuentas: CuentaConStats[];
  moneda: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [cuentaOrigenId, setCuentaOrigenId] = useState("");
  const [cuentaDestinoId, setCuentaDestinoId] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(formatFechaInput(new Date()));
  const [descripcion, setDescripcion] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const origen = cuentas.find((c) => c.id === cuentaOrigenId);
  const montoNum = parseFloat(monto.replace(",", "."));
  const opcionesDestino = cuentas.filter((c) => c.id !== cuentaOrigenId);

  function resetear() {
    setCuentaOrigenId("");
    setCuentaDestinoId("");
    setMonto("");
    setFecha(formatFechaInput(new Date()));
    setDescripcion("");
  }

  function handleConfirmar() {
    if (!cuentaOrigenId || !cuentaDestinoId) {
      toast({ variant: "destructive", title: "Elegí cuenta de origen y destino." });
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      toast({ variant: "destructive", title: "Ingresá un monto válido." });
      return;
    }

    startTransition(async () => {
      const result = await transferirEntreCuentasAction({
        cuentaOrigenId,
        cuentaDestinoId,
        monto: montoNum,
        fecha: parseFechaLocal(fecha) ?? new Date(),
        descripcion: descripcion.trim() || undefined,
      });
      if (result.success) {
        toast({ title: "Transferencia realizada ✓" });
        resetear();
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetear(); onOpenChange(o); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Transferir entre cuentas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Desde</Label>
            <Select value={cuentaOrigenId} onValueChange={(v) => {
              setCuentaOrigenId(v);
              if (v === cuentaDestinoId) setCuentaDestinoId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Cuenta de origen" />
              </SelectTrigger>
              <SelectContent>
                {cuentas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      {c.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {origen && (
              <p className="text-xs text-muted-foreground">
                Saldo disponible: {formatCurrency(origen.saldo, moneda)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Hacia</Label>
            <Select value={cuentaDestinoId} onValueChange={setCuentaDestinoId} disabled={!cuentaOrigenId}>
              <SelectTrigger>
                <SelectValue placeholder="Cuenta de destino" />
              </SelectTrigger>
              <SelectContent>
                {opcionesDestino.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      {c.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="transf-monto">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {moneda}
                </span>
                <Input
                  id="transf-monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="pl-12"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transf-fecha">Fecha</Label>
              <Input
                id="transf-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transf-desc">
              Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="transf-desc"
              placeholder="ej. Pase a banco"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={isPending}>
            {isPending ? "Transfiriendo…" : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
