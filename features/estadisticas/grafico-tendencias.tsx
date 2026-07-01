// features/estadisticas/grafico-tendencias.tsx
"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DatoMensualHistorico } from "./queries";
import { formatCurrency } from "@/lib/utils";

interface GraficoTendenciasProps {
  datos: DatoMensualHistorico[];
  moneda: string;
  tab: "gastos" | "ingresos" | "neto";
}

function CustomTooltip({ active, payload, label, moneda }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
      <p className="font-semibold capitalize">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrency(Math.abs(p.value), moneda)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function GraficoTendencias({ datos, moneda, tab }: GraficoTendenciasProps) {
  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <p className="text-sm text-muted-foreground">Sin datos históricos</p>
      </div>
    );
  }

  const config = {
    gastos: [
      { key: "gasto", name: "Gastos", color: "hsl(var(--expense))" },
    ],
    ingresos: [
      { key: "ingreso", name: "Ingresos", color: "hsl(var(--income))" },
    ],
    neto: [
      { key: "ingreso", name: "Ingresos", color: "hsl(var(--income))" },
      { key: "gasto",   name: "Gastos",   color: "hsl(var(--expense))" },
      { key: "neto",    name: "Neto",     color: "hsl(var(--primary))" },
    ],
  }[tab];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={datos} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) =>
            v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` :
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip moneda={moneda} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
        {config.map((c) => (
          <Line
            key={c.key}
            type="monotone"
            dataKey={c.key}
            name={c.name}
            stroke={c.color}
            strokeWidth={2}
            dot={{ r: 3, fill: c.color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}