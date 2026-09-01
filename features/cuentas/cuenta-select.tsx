// features/cuentas/cuenta-select.tsx
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type CuentaSimple = {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
};

interface CuentaSelectProps {
  cuentas: CuentaSimple[];
  value?: string;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
  label?: string;
}

export function CuentaSelect({ cuentas, value, onChange, disabled, label = "Cuenta" }: CuentaSelectProps) {
  if (cuentas.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>
        {label} <span className="text-muted-foreground font-normal">(opcional)</span>
      </Label>
      <Select
        value={value ?? "ninguna"}
        onValueChange={(v) => onChange(v === "ninguna" ? undefined : v)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Sin cuenta específica" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ninguna">Sin cuenta</SelectItem>
          {cuentas.map((cuenta) => (
            <SelectItem key={cuenta.id} value={cuenta.id}>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: cuenta.color }} />
                {cuenta.nombre}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
