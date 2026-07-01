// features/estadisticas/grafico-diario.tsx
"use client";

import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DatoDiarioDetallado } from "./queries";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Vista = "barras" | "acumulado";

interface GraficoDiarioProps {
  datos: DatoDiarioDetallado[];
  moneda: string;
  tab: "gastos" | "ingresos" | "neto";
}

function CustomTooltip({ active, payload, label, moneda }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5 min-w-[160px]">
      <p className="font-semibold">Día {label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-medium tabular-nums">{formatCurrency(p.value, moneda)}</span>
        </div>
      ))}
    </div>
  );
}

export function GraficoDiario({ datos, moneda, tab }: GraficoDiarioProps) {
  const [vista, setVista] = useState<Vista>("barras");

  if (datos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px]">
        <p className="text-sm text-muted-foreground">Sin movimientos en este período</p>
      </div>
    );
  }

  const tickEvery = datos.length > 20 ? 4 : datos.length > 10 ? 2 : 1;

  // Configuración según tab activo
  const config = {
    gastos: {
      barKey:   "gasto",
      lineKey:  "acumuladoGasto",
      barName:  "Gastos del día",
      lineName: "Acumulado gastos",
      barColor: "hsl(var(--expense))",
      lineColor: "#f87171",
    },
    ingresos: {
      barKey:   "ingreso",
      lineKey:  "acumuladoIngreso",
      barName:  "Ingresos del día",
      lineName: "Acumulado ingresos",
      barColor: "hsl(var(--income))",
      lineColor: "#4ade80",
    },
    neto: {
      barKey:   "neto",
      lineKey:  "acumuladoNeto",
      barName:  "Neto del día",
      lineName: "Acumulado neto",
      barColor: "hsl(var(--primary))",
      lineColor: "#60a5fa",
    },
  }[tab];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Tabs value={vista} onValueChange={(v) => setVista(v as Vista)}>
          <TabsList className="h-7 text-xs">
            <TabsTrigger value="barras"    className="text-xs px-3 h-6">Por día</TabsTrigger>
            <TabsTrigger value="acumulado" className="text-xs px-3 h-6">Acumulado</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={datos} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={tickEvery - 1}
          />
          <YAxis
            tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip content={<CustomTooltip moneda={moneda} />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />

          {vista === "barras" ? (
            <Bar
              dataKey={config.barKey}
              name={config.barName}
              fill={config.barColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          ) : (
            <Line
              type="monotone"
              dataKey={config.lineKey}
              name={config.lineName}
              stroke={config.lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}