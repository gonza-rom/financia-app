// components/deudas/deuda-list.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeudaCard } from "./deuda-card";
import { DeudaFormDialog } from "./deuda-form-dialog";
import type { Deuda } from "@/types/deudas";

interface DeudaListProps {
  deudas: Deuda[];
}

export function DeudaList({ deudas }: DeudaListProps) {
  const [open, setOpen] = useState(false);

  const cobrar = deudas.filter((d) => d.tipo === "cobrar");
  const pagar  = deudas.filter((d) => d.tipo === "pagar");

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs defaultValue="cobrar" className="w-full">
          <div className="flex items-center justify-between mb-4 gap-3">
            <TabsList>
              <TabsTrigger value="cobrar">
                Me deben
                {cobrar.length > 0 && (
                  <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5">
                    {cobrar.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pagar">
                Yo debo
                {pagar.length > 0 && (
                  <span className="ml-2 text-xs bg-muted rounded-full px-1.5 py-0.5">
                    {pagar.length}
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
              cobrar.map((d) => <DeudaCard key={d.id} deuda={d} />)
            )}
          </TabsContent>

          <TabsContent value="pagar" className="mt-0 space-y-3">
            {pagar.length === 0 ? (
              <EmptyState mensaje="No tenés deudas por pagar." />
            ) : (
              pagar.map((d) => <DeudaCard key={d.id} deuda={d} />)
            )}
          </TabsContent>
        </Tabs>
      </div>

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