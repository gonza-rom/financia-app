// features/transactions/transaction-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Categoria } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TransactionFiltersBarProps {
  categorias: Categoria[];
}

export function TransactionFiltersBar({ categorias }: TransactionFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

      <Select value={searchParams.get("categoriaId") ?? "todas"}
        onValueChange={(v) => updateParam("categoriaId", v === "todas" ? null : v)}>
        <SelectTrigger className="w-[160px] h-8 text-sm">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las categorías</SelectItem>
          {categorias.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input placeholder="Buscar…" className="h-8 text-sm w-[160px]"
        defaultValue={searchParams.get("busqueda") ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          const timeout = setTimeout(() => updateParam("busqueda", val || null), 400);
          return () => clearTimeout(timeout);
        }} />

      {hayFiltros && (
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={() => router.push("?")}>
          <X className="size-3.5" /> Limpiar
        </Button>
      )}
    </div>
  );
}