// features/estadisticas/tabla-categorias.tsx
"use client";

import { useState } from "react";
import type { CategoriaStats } from "./queries";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TablaCategorias {
  categorias: CategoriaStats[];
  moneda: string;
  tab: "gastos" | "ingresos" | "neto";
}

type OrdenarPor = "montoMes" | "montoTotal" | "cambio" | "porcentajeMes";

export function TablaCategorias({ categorias, moneda, tab }: TablaCategorias) {
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>("montoMes");

  const filtradas = categorias.filter((c) =>
    tab === "gastos" ? c.tipo === "GASTO" :
    tab === "ingresos" ? c.tipo === "INGRESO" :
    true
  );

  const ordenadas = [...filtradas].sort((a, b) => {
    if (ordenarPor === "cambio") return b.cambio - a.cambio;
    return b[ordenarPor] - a[ordenarPor];
  });

  if (ordenadas.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-muted-foreground">Sin movimientos en este período</p>
      </div>
    );
  }

  const maxMes = Math.max(...ordenadas.map((c) => c.montoMes));

  function Th({ label, key }: { label: string; key: OrdenarPor }) {
    return (
      <th
        className={cn(
          "text-right text-xs font-medium text-muted-foreground pb-2 cursor-pointer hover:text-foreground transition-colors select-none",
          ordenarPor === key && "text-foreground"
        )}
        onClick={() => setOrdenarPor(key)}
      >
        {label} {ordenarPor === key && "↓"}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground pb-2 w-[35%]">
              Categoría
            </th>
            <Th label="Este mes" key="montoMes" />
            <Th label="Total histórico" key="montoTotal" />
            <Th label="% del mes" key="porcentajeMes" />
            <Th label="vs mes ant." key="cambio" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ordenadas.map((cat) => {
            const barWidth = maxMes > 0 ? (cat.montoMes / maxMes) * 100 : 0;
            const cambioPositivo = cat.tipo === "INGRESO" ? cat.cambio >= 0 : cat.cambio <= 0;

            return (
              <tr key={cat.categoriaId} className="group hover:bg-muted/30 transition-colors">
                {/* Categoría */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cat.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.cantidadMes} movimiento{cat.cantidadMes !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Monto mes + barra */}
                <td className="py-3 text-right">
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(cat.montoMes, moneda)}
                  </p>
                  <div className="flex justify-end mt-1">
                    <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                </td>

                {/* Total histórico */}
                <td className="py-3 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(cat.montoTotal, moneda)}
                  <p className="text-xs text-muted-foreground/70">
                    {cat.cantidadTotal} total
                  </p>
                </td>

                {/* Porcentaje del mes */}
                <td className="py-3 text-right tabular-nums">
                  <span className="text-sm font-medium">
                    {cat.porcentajeMes.toFixed(1)}%
                  </span>
                </td>

                {/* Cambio vs mes anterior */}
                <td className="py-3 text-right">
                  {cat.mesAnterior === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      cambioPositivo ? "text-income" : "text-expense"
                    )}>
                      {cat.cambio > 2 ? <TrendingUp className="size-3" /> :
                       cat.cambio < -2 ? <TrendingDown className="size-3" /> :
                       <Minus className="size-3" />}
                      {cat.cambio >= 0 ? "+" : ""}
                      {cat.cambio.toFixed(1)}%
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}