// features/empresas/nueva-empresa-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmpresaDialog } from "./empresa-dialog";

export function NuevaEmpresaButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" /> Nueva empresa
      </Button>
      <EmpresaDialog open={open} onOpenChange={setOpen} />
    </>
  );
}