// features/categories/categoria-select-items.tsx
"use client";

import { SelectGroup, SelectItem } from "@/components/ui/select";
import { agruparPorPadre, type CategoriaBase } from "@/lib/categorias";

// Renderiza las <SelectItem> de un <Select> de categoría, agrupando cada
// categoría padre con sus subcategorías indentadas debajo. El padre también
// queda seleccionable (no todo gasto necesita una subcategoría).
export function CategoriaSelectItems<T extends CategoriaBase>({ categorias }: { categorias: T[] }) {
  const grupos = agruparPorPadre(categorias);

  return (
    <>
      {grupos.map(({ padre, hijos }) => (
        <SelectGroup key={padre.id}>
          <SelectItem value={padre.id} className="font-medium">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: padre.color }} />
              {padre.nombre}
            </span>
          </SelectItem>
          {hijos.map((hijo) => (
            <SelectItem key={hijo.id} value={hijo.id} className="pl-6">
              <span className="flex items-center gap-2">
                <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: hijo.color }} />
                {hijo.nombre}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}
