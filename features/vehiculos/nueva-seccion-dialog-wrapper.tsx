// features/vehiculos/nueva-seccion-dialog-wrapper.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NuevaSeccionDialog } from "./nueva-seccion-dialog";

export function NuevaSeccionDialogWrapper({ vehiculoId }: { vehiculoId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Nueva sección
      </Button>
      <NuevaSeccionDialog vehiculoId={vehiculoId} open={open} onOpenChange={setOpen} />
    </>
  );
}