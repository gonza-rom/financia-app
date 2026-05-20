// features/deudas/deuda-form-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { crearDeuda } from "./actions";

type TipoDeuda = "cobrar" | "pagar";
type Moneda = "ARS" | "USD" | "EUR";

interface FormValues {
  tipo: TipoDeuda;
  contraparte: string;
  moneda: Moneda;
  montoTotal: number;
  tieneCuotas: boolean;
  cantidadCuotas: number;
  descripcion: string;
  fechaVencimiento: string;
}

const MONEDAS: { value: Moneda; label: string }[] = [
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "USD", label: "USD — Dólar" },
  { value: "EUR", label: "EUR — Euro" },
];

const INITIAL: FormValues = {
  tipo: "cobrar",
  contraparte: "",
  moneda: "ARS",
  montoTotal: 0,
  tieneCuotas: false,
  cantidadCuotas: 1,
  descripcion: "",
  fechaVencimiento: "",
};

interface DeudaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contraparteInicial?: string;
  empresaIdInicial?: string;
}

export function DeudaFormDialog({ open, onOpenChange,contraparteInicial = "",empresaIdInicial }: DeudaFormDialogProps) {
  const [form, setForm] = useState<FormValues>({
    ...INITIAL,
    contraparte: contraparteInicial,
  });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.contraparte.trim() || !form.montoTotal) {
      toast({
        variant: "destructive",
        title: "Faltan datos",
        description: "Completá la persona/empresa y el monto.",
      });
      return;
    }

    startTransition(async () => {
      const result = await crearDeuda({
        tipo: form.tipo.toUpperCase() as "COBRAR" | "PAGAR",
        contraparte: form.contraparte.trim(),
        moneda: form.moneda,
        montoTotal: form.montoTotal,
        tieneCuotas: form.tieneCuotas,
        cantidadCuotas: form.tieneCuotas ? form.cantidadCuotas : null,
        descripcion: form.descripcion.trim() || null,
        fechaVencimiento: !form.tieneCuotas && form.fechaVencimiento
          ? new Date(form.fechaVencimiento)
          : null,
      });

      if (result.success) {
        toast({ title: "Deuda registrada" });
        setForm(INITIAL);
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
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
                type="button"
                onClick={() => set("tipo", t)}
                className={[
                  "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                  form.tipo === t
                    ? t === "cobrar"
                      ? "border-income bg-income/10 text-income"
                      : "border-expense bg-expense/10 text-expense"
                    : "border-border text-muted-foreground hover:border-foreground/30",
                ].join(" ")}
              >
                {t === "cobrar" ? "Me deben" : "Yo debo"}
              </button>
            ))}
          </div>

          {/* Contraparte */}
          <div className="space-y-1.5">
            <Label>Persona o empresa</Label>
            <Input
              placeholder="Nombre o razón social"
              value={form.contraparte}
              onChange={(e) => set("contraparte", e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>
              Descripción{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Motivo de la deuda…"
              rows={2}
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Moneda + Monto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select
                value={form.moneda}
                onValueChange={(v) => set("moneda", v as Moneda)}
                disabled={isPending}
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
                step="0.01"
                placeholder="0.00"
                value={form.montoTotal || ""}
                onChange={(e) => set("montoTotal", Number(e.target.value))}
                disabled={isPending}
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
              disabled={isPending}
            />
          </div>

          {/* Cuotas o vencimiento */}
          {form.tieneCuotas ? (
            <div className="space-y-1.5">
              <Label>Cantidad de cuotas</Label>
              <Input
                type="number"
                min={2}
                max={120}
                value={form.cantidadCuotas}
                onChange={(e) => set("cantidadCuotas", Number(e.target.value))}
                disabled={isPending}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>
                Fecha de vencimiento{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => set("fechaVencimiento", e.target.value)}
                disabled={isPending}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar deuda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}