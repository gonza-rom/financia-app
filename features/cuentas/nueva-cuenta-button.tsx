"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NuevaCuentaDialog } from "./nueva-cuenta-dialog";

export function NuevaCuentaButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4 mr-1.5" />
        Nueva cuenta
      </Button>
      <NuevaCuentaDialog open={open} onOpenChange={setOpen} />
    </>
  );
}