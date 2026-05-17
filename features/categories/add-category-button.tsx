// features/categories/add-category-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoriaDialog } from "./category-dialog";

export function AddCategoryButton() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Button onClick={() => setAbierto(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Nueva categoría
      </Button>
      <CategoriaDialog open={abierto} onOpenChange={setAbierto} />
    </>
  );
}