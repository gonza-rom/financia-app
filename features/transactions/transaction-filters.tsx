// features/transactions/transaction-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import type { Categoria } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { CategoriaCombobox } from "@/features/categories/categoria-combobox";

interface TransactionFiltersBarProps {
  categorias: Categoria[];
}

export function TransactionFiltersBar({ categorias }: TransactionFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const busquedaTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.delete("pagina");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const tipoActivo = searchParams.get("tipo") as TipoTransaccion | null;
  const hayFiltros = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
        <button onClick={() => updateParam("tipo", null)}
          className={cn("px-3 py-1.5 transition-colors",
            !tipoActivo ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
          Todos
        </button>
        <button onClick={() => updateParam("tipo", TipoTransaccion.INGRESO)}
          className={cn("px-3 py-1.5 transition-colors border-l border-border",
            tipoActivo === TipoTransaccion.INGRESO ? "bg-income/10 text-income" : "text-muted-foreground hover:text-foreground")}>
          Ingresos
        </button>
        <button onClick={() => updateParam("tipo", TipoTransaccion.GASTO)}
          className={cn("px-3 py-1.5 transition-colors border-l border-border",
            tipoActivo === TipoTransaccion.GASTO ? "bg-expense/10 text-expense" : "text-muted-foreground hover:text-foreground")}>
          Gastos
        </button>
      </div>

      <CategoriaCombobox
        categorias={categorias}
        value={searchParams.get("categoriaId") ?? undefined}
        onChange={(id) => updateParam("categoriaId", id || null)}
        allowNone
        noneLabel="Todas las categorías"
        placeholder="Categoría"
        className="w-[180px] h-8 text-sm"
      />

      <Input placeholder="Buscar…" className="h-8 text-sm w-[160px]"
        defaultValue={searchParams.get("busqueda") ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          clearTimeout(busquedaTimeout.current);
          busquedaTimeout.current = setTimeout(() => updateParam("busqueda", val || null), 400);
        }} />

      <div className="flex items-center gap-1.5">
        <Input type="date" className="h-8 text-sm w-[140px]"
          value={searchParams.get("fechaDesde") ?? ""}
          onChange={(e) => updateParam("fechaDesde", e.target.value || null)} />
        <span className="text-xs text-muted-foreground">a</span>
        <Input type="date" className="h-8 text-sm w-[140px]"
          value={searchParams.get("fechaHasta") ?? ""}
          onChange={(e) => updateParam("fechaHasta", e.target.value || null)} />
      </div>

      {hayFiltros && (
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => router.push("?")}>
          <X className="size-3.5" /> Limpiar
        </Button>
      )}
    </div>
  );
}