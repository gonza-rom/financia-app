// features/categories/categoria-combobox.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { agruparPorPadre, type CategoriaBase } from "@/lib/categorias";

interface CategoriaComboboxProps<T extends CategoriaBase> {
  categorias: T[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

// Selector de categoría con búsqueda — con 90+ categorías (padre + subcategorías) un
// <select> plano para desplazar es incómodo. Filtra por nombre en cualquier nivel y
// mantiene el grupo padre visible mientras alguno de sus hijos matchee.
export function CategoriaCombobox<T extends CategoriaBase>({
  categorias, value, onChange, placeholder = "Seleccionar categoría", emptyMessage = "Sin categorías", disabled, className,
}: CategoriaComboboxProps<T>) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const seleccionada = categorias.find((c) => c.id === value);

  const grupos = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    const base = agruparPorPadre(categorias);
    if (!query) return base;
    return base
      .map(({ padre, hijos }) => ({
        padre,
        hijos: hijos.filter((h) => h.nombre.toLowerCase().includes(query)),
      }))
      .filter(({ padre, hijos }) => padre.nombre.toLowerCase().includes(query) || hijos.length > 0);
  }, [categorias, busqueda]);

  function seleccionar(id: string) {
    onChange(id);
    setOpen(false);
    setBusqueda("");
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setBusqueda(""); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          {seleccionada ? (
            <span className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: seleccionada.color }} />
              <span className="truncate">{seleccionada.nombre}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="size-4 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar categoría…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {categorias.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">{emptyMessage}</p>
          ) : grupos.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">Sin resultados</p>
          ) : (
            grupos.map(({ padre, hijos }) => (
              <div key={padre.id}>
                <button
                  type="button"
                  onClick={() => seleccionar(padre.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium hover:bg-accent transition-colors",
                    value === padre.id && "bg-accent"
                  )}
                >
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: padre.color }} />
                  <span className="truncate flex-1 text-left">{padre.nombre}</span>
                  {value === padre.id && <Check className="size-3.5 shrink-0" />}
                </button>
                {hijos.map((hijo) => (
                  <button
                    key={hijo.id}
                    type="button"
                    onClick={() => seleccionar(hijo.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm py-1.5 pl-7 pr-2 text-xs hover:bg-accent transition-colors",
                      value === hijo.id && "bg-accent"
                    )}
                  >
                    <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: hijo.color }} />
                    <span className="truncate flex-1 text-left">{hijo.nombre}</span>
                    {value === hijo.id && <Check className="size-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
