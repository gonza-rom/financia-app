// features/dashboard/daily-chart.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { DatoDiario } from "./daily-chart-query";
import { formatCurrency } from "@/lib/utils";

interface DailyChartProps {
  datos: DatoDiario[];
  moneda: string;
}

function CustomTooltip({ active, payload, label, moneda }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  moneda: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5">
      <p className="font-semibold text-foreground">Día {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-medium tabular-nums">{formatCurrency(p.value, moneda)}</span>
        </div>
      ))}
    </div>
  );
}

export function DailyChart({ datos, moneda }: DailyChartProps) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm text-muted-foreground">Sin movimientos este mes</p>
      </div>
    );
  }

  // Mostrar ticks cada 5 días si hay muchos datos
  const tickInterval = datos.length > 15 ? 4 : 1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={datos} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={tickInterval}
        />
        <YAxis
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={38}
        />
        <Tooltip content={<CustomTooltip moneda={moneda} />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
        <Bar dataKey="ingreso" name="ingreso" fill="hsl(var(--income))" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar dataKey="gasto"   name="gasto"   fill="hsl(var(--expense))" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}