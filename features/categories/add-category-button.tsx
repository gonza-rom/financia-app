// src/features/categories/add-category-button.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "./category-dialog";

export function AddCategoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5">
        <Plus className="size-4" />
        Add Category
      </Button>
      <CategoryDialog open={open} onOpenChange={setOpen} />
    </>
  );
}