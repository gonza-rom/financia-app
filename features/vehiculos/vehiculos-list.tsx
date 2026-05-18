// features/vehiculos/vehiculos-list.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { VehiculoResumen } from "@/types/vehiculos";
import { formatCurrency } from "@/lib/utils";
import { Car, ChevronRight, Pencil, Trash2, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { eliminarVehiculoAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { EditarVehiculoDialog } from "./editar-vehiculo-dialog";

interface VehiculosListProps {
  vehiculos: VehiculoResumen[];
  moneda: string;
}

function VehiculoCard({
  vehiculo,
  moneda,
}: {
  vehiculo: VehiculoResumen;
  moneda: string;
}) {
  const [editando, setEditando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleEliminar() {
    if (!confirm(`¿Eliminar "${vehiculo.nombre}"? Se conservarán todos los gastos registrados.`)) return;
    startTransition(async () => {
      const result = await eliminarVehiculoAction(vehiculo.id);
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Vehículo eliminado" });
      }
    });
  }

  return (
    <>
      <div className="group rounded-xl border border-border bg-card overflow-hidden">
        {/* Header con color */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: vehiculo.color }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${vehiculo.color}20`, color: vehiculo.color }}
              >
                <Car className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{vehiculo.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {vehiculo.marca} {vehiculo.modelo} · {vehiculo.anio}
                </p>
                {vehiculo.patente && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {vehiculo.patente}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setEditando(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={handleEliminar}
                disabled={isPending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Total gastado</p>
              <p className="text-sm font-semibold">{formatCurrency(vehiculo.totalGastado, moneda)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Gauge className="size-3" /> Kilometraje
              </p>
              <p className="text-sm font-semibold">
                {vehiculo.kilometraje?.toLocaleString("es-AR") ?? "—"} km
              </p>
            </div>
          </div>

          {/* Secciones preview */}
          {vehiculo.secciones.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {vehiculo.secciones.map((s) => (
                <span
                  key={s.id}
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${s.color}20`, color: s.color }}
                >
                  {s.nombre}
                </span>
              ))}
            </div>
          )}

          <Link
            href={`/vehiculos/${vehiculo.id}`}
            className={cn(
              "flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-primary/5 text-primary hover:bg-primary/10"
            )}
          >
            Ver detalle
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {editando && (
        <EditarVehiculoDialog
          vehiculo={vehiculo}
          open={editando}
          onOpenChange={setEditando}
        />
      )}
    </>
  );
}

export function VehiculosList({ vehiculos, moneda }: VehiculosListProps) {
  if (vehiculos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Car className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">Sin vehículos todavía</p>
        <p className="text-xs text-muted-foreground">
          Agregá tu primer vehículo para empezar a registrar gastos.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {vehiculos.map((v) => (
        <VehiculoCard key={v.id} vehiculo={v} moneda={moneda} />
      ))}
    </div>
  );
}