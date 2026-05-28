// features/deudas/deuda-list.tsx
"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContraparteCard } from "./contraparte-card";
import { DeudaFormDialog } from "./deuda-form-dialog";
import type { Deuda } from "@/types/deudas";

interface DeudaListProps {
  deudas: Deuda[];
}

function groupByContraparte(deudas: Deuda[]) {
  const map = new Map<string, { nombre: string; empresaId?: string; deudas: Deuda[] }>();

  for (const deuda of deudas) {
    const key = deuda.empresaId ?? deuda.contraparte;
    if (!map.has(key)) {
      map.set(key, {
        nombre: deuda.contraparte,
        empresaId: deuda.empresaId,
        deudas: [],
      });
    }
    map.get(key)!.deudas.push(deuda);
  }

  // Primero las que tienen vencidas, luego por nombre
  return Array.from(map.values()).sort((a, b) => {
    const aVencida = a.deudas.some((d) => d.estado === "vencida");
    const bVencida = b.deudas.some((d) => d.estado === "vencida");
    if (aVencida && !bVencida) return -1;
    if (!aVencida && bVencida) return 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

export function DeudaList({ deudas }: DeudaListProps) {
  const [open, setOpen] = useState(false);

  const cobrarDeudas = useMemo(
    () => deudas.filter((d) => d.tipo === "cobrar"),
    [deudas]
  );
  const pagarDeudas = useMemo(
    () => deudas.filter((d) => d.tipo === "pagar"),
    [deudas]
  );

  const cobrar = useMemo(() => groupByContraparte(cobrarDeudas), [cobrarDeudas]);
  const pagar  = useMemo(() => groupByContraparte(pagarDeudas),  [pagarDeudas]);

  return (
    <>
      <Tabs defaultValue="cobrar" className="w-full">
        <div className="flex items-center justify-between mb-4 gap-3">
          <TabsList>
            <TabsTrigger value="cobrar">
              Me deben
              {cobrarDeudas.length > 0 && (
                <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5 tabular-nums">
                  {cobrarDeudas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pagar">
              Yo debo
              {pagarDeudas.length > 0 && (
                <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5 tabular-nums">
                  {pagarDeudas.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="size-4 mr-1.5" />
            Nueva deuda
          </Button>
        </div>

        <TabsContent value="cobrar" className="mt-0 space-y-3">
          {cobrar.length === 0 ? (
            <EmptyState mensaje="No tenés deudas por cobrar." />
          ) : (
            cobrar.map((g) => (
              <ContraparteCard
                key={g.empresaId ?? g.nombre}
                nombre={g.nombre}
                empresaId={g.empresaId}
                deudas={g.deudas}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pagar" className="mt-0 space-y-3">
          {pagar.length === 0 ? (
            <EmptyState mensaje="No tenés deudas por pagar." />
          ) : (
            pagar.map((g) => (
              <ContraparteCard
                key={g.empresaId ?? g.nombre}
                nombre={g.nombre}
                empresaId={g.empresaId}
                deudas={g.deudas}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <DeudaFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
      <p className="text-sm text-muted-foreground">{mensaje}</p>
    </div>
  );
}