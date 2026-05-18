// components/deudas/deuda-card.tsx
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Deuda } from "@/types/deudas";

interface DeudaCardProps {
  deuda: Deuda;
}

const ESTADO_CONFIG = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  pagada: {
    label: "Pagada",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  vencida: {
    label: "Vencida",
    icon: AlertCircle,
    className: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
} as const;

function formatMoney(amount: number, moneda: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DeudaCard({ deuda }: DeudaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = ESTADO_CONFIG[deuda.estado];
  const Icon = config.icon;

  const cuotasPagadas = deuda.cuotas?.filter((c) => c.pagada).length ?? 0;
  const totalCuotas   = deuda.cuotas?.length ?? 0;
  const progreso = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-shadow hover:shadow-sm",
        deuda.estado === "vencida" && "border-rose-200 dark:border-rose-900/60"
      )}
    >
      {/* Fila principal */}
      <div className="p-4 flex items-start gap-3">
        {/* Ícono contraparte */}
        <div className="mt-0.5 rounded-lg bg-muted p-2 shrink-0">
          {deuda.empresaId ? (
            <Building2 className="size-4 text-muted-foreground" />
          ) : (
            <User className="size-4 text-muted-foreground" />
          )}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{deuda.contraparte}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                config.className
              )}
            >
              <Icon className="size-3" />
              {config.label}
            </span>
          </div>

          {deuda.descripcion && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {deuda.descripcion}
            </p>
          )}

          {/* Fecha de vencimiento o próxima cuota */}
          {deuda.fechaVencimiento && !deuda.cuotas && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
              <Calendar className="size-3" />
              Vence el {formatDate(deuda.fechaVencimiento)}
            </div>
          )}

          {/* Progreso cuotas */}
          {totalCuotas > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Cuotas</span>
                <span>{cuotasPagadas} / {totalCuotas}</span>
              </div>
              <Progress value={progreso} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Monto + expandir */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="font-semibold text-base">
            {formatMoney(deuda.montoTotal, deuda.moneda)}
          </span>
          {totalCuotas > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={expanded ? "Ocultar cuotas" : "Ver cuotas"}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Panel de cuotas expandible */}
      {expanded && deuda.cuotas && (
        <div className="border-t border-border px-4 pb-3 pt-3 space-y-2">
          {deuda.cuotas.map((cuota) => (
            <div
              key={cuota.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={cn(
                    "size-4",
                    cuota.pagada
                      ? "text-emerald-500"
                      : "text-muted-foreground/40"
                  )}
                />
                <span className={cuota.pagada ? "line-through text-muted-foreground" : ""}>
                  Cuota {cuota.numero}
                </span>
                {!cuota.pagada && cuota.fechaVencimiento && (
                  <span className="text-xs text-muted-foreground">
                    · {formatDate(cuota.fechaVencimiento)}
                  </span>
                )}
              </div>
              <span className={cuota.pagada ? "text-muted-foreground" : "font-medium"}>
                {formatMoney(cuota.monto, deuda.moneda)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}