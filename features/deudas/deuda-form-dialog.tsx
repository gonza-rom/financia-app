// components/deudas/deuda-form-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { DeudaFormValues, Moneda, TipoDeuda } from "@/types/deudas";

interface DeudaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "USD", label: "USD — Dólar" },
  { value: "EUR", label: "EUR — Euro" },
];

export function DeudaFormDialog({ open, onOpenChange }: DeudaFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<DeudaFormValues>({
    tipo: "cobrar",
    contraparte: "",
    moneda: "ARS",
    montoTotal: 0,
    tieneCuotas: false,
    cantidadCuotas: 1,
    descripcion: "",
    fechaVencimiento: "",
  });

  function set<K extends keyof DeudaFormValues>(key: K, value: DeudaFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.contraparte || !form.montoTotal) return;
    setLoading(true);
    try {
      await fetch("/api/deudas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onOpenChange(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva deuda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(["cobrar", "pagar"] as TipoDeuda[]).map((t) => (
              <button
                key={t}
                onClick={() => set("tipo", t)}
                className={`
                  rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                  ${form.tipo === t
                    ? t === "cobrar"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                  }
                `}
              >
                {t === "cobrar" ? "Me deben" : "Yo debo"}
              </button>
            ))}
          </div>

          {/* Contraparte */}
          <div className="space-y-1.5">
            <Label>Persona o empresa</Label>
            <Input
              placeholder="Nombre completo o razón social"
              value={form.contraparte}
              onChange={(e) => set("contraparte", e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>Descripción <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea
              placeholder="Motivo de la deuda..."
              rows={2}
              value={form.descripcion ?? ""}
              onChange={(e) => set("descripcion", e.target.value)}
            />
          </div>

          {/* Moneda + Monto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select
                value={form.moneda}
                onValueChange={(v) => set("moneda", v as Moneda)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Monto total</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.montoTotal || ""}
                onChange={(e) => set("montoTotal", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Switch cuotas */}
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Pago en cuotas</p>
              <p className="text-xs text-muted-foreground">Dividir en múltiples pagos</p>
            </div>
            <Switch
              checked={form.tieneCuotas}
              onCheckedChange={(v) => set("tieneCuotas", v)}
            />
          </div>

          {/* Cuotas o fecha de vencimiento */}
          {form.tieneCuotas ? (
            <div className="space-y-1.5">
              <Label>Cantidad de cuotas</Label>
              <Input
                type="number"
                min={2}
                max={120}
                value={form.cantidadCuotas ?? 1}
                onChange={(e) => set("cantidadCuotas", Number(e.target.value))}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Fecha de vencimiento <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                type="date"
                value={form.fechaVencimiento ?? ""}
                onChange={(e) => set("fechaVencimiento", e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando…" : "Guardar deuda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}