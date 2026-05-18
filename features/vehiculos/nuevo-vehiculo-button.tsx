// features/vehiculos/nuevo-vehiculo-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehiculoDialog } from "./vehiculo-dialog";

export function NuevoVehiculoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Nuevo vehículo
      </Button>
      <VehiculoDialog open={open} onOpenChange={setOpen} />
    </>
  );
}