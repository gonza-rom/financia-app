// features/vehiculos/seccion-card.tsx
"use client";

import { eliminarSeccionAction } from "./actions";
import { useState } from "react";
import { useTransition } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SeccionConGastos } from "@/types/vehiculos";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { eliminarGastoVehiculoAction } from "./actions";
import { GastoDialog } from "./gasto-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Categoria } from "@prisma/client";

interface SeccionCardProps {
  vehiculoId: string;
  seccion: SeccionConGastos;
  moneda: string;
  categorias: Categoria[];
}

export function SeccionCard({ vehiculoId, seccion, moneda,categorias }: SeccionCardProps) {
  const [expandido, setExpandido] = useState(false);
  const [dialogGasto, setDialogGasto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleEliminarGasto(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    startTransition(async () => {
      const result = await eliminarGastoVehiculoAction(id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Gasto eliminado" });
      }
    });
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header de la sección */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="size-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ backgroundColor: `${seccion.color}20`, color: seccion.color }}
            >
              {seccion.nombre.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{seccion.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {seccion._count.gastos} gasto{seccion._count.gastos !== 1 ? "s" : ""}
                {" · "}
                <span className="font-medium" style={{ color: seccion.color }}>
                  {formatCurrency(seccion.totalGastado, moneda)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setDialogGasto(true)}
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setExpandido(!expandido)}
            >
              {expandido
                ? <ChevronUp className="size-3.5" />
                : <ChevronDown className="size-3.5" />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => {
                    if (!confirm(`¿Eliminar la sección "${seccion.nombre}"? Se eliminarán también todos sus gastos.`)) return;
                    startTransition(async () => {
                    const result = await eliminarSeccionAction(seccion.id);
                    if (!result.success) {
                        toast({ variant: "destructive", title: "Error", description: result.error });
                    } else {
                        toast({ title: "Sección eliminada" });
                    }
                    });
                }}
                disabled={isPending}
                >
                <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Lista de gastos (expandible) */}
        {expandido && (
          <div className="border-t border-border divide-y divide-border">
            {seccion.gastos.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">Sin gastos registrados.</p>
                <button
                  onClick={() => setDialogGasto(true)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Registrar el primero
                </button>
              </div>
            ) : (
              <>
                {seccion.gastos.map((gasto) => (
                  <div
                    key={gasto.id}
                    className="flex items-center gap-3 px-4 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{gasto.descripcion}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {formatShortDate(gasto.fecha)}
                        </p>
                        {gasto.kilometraje && (
                          <span className="text-xs text-muted-foreground">
                            · {gasto.kilometraje.toLocaleString("es-AR")} km
                          </span>
                        )}
                        {gasto.litros && (
                          <span className="text-xs text-muted-foreground">
                            · {gasto.litros}L
                          </span>
                        )}
                        {gasto.vencimiento && (
                          <span className={cn(
                            "text-xs",
                            new Date(gasto.vencimiento) < new Date()
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          )}>
                            · Vence {formatShortDate(gasto.vencimiento)}
                          </span>
                        )}
                        {gasto.proximoKm && (
                          <span className="text-xs text-muted-foreground">
                            · Próximo: {gasto.proximoKm.toLocaleString("es-AR")} km
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(gasto.monto), moneda)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEliminarGasto(gasto.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {seccion._count.gastos > seccion.gastos.length && (
                  <div className="px-4 py-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      Mostrando los últimos 5 gastos.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <GastoDialog
        vehiculoId={vehiculoId}
        seccion={seccion}
        categorias={categorias}
        open={dialogGasto}
        onOpenChange={setDialogGasto}
      />
    </>
  );
}