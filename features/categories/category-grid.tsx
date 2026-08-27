// features/categories/category-grid.tsx
"use client";

import type { CategoriaConEstadisticas } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryDialog } from "./edit-category-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { agruparPorPadre } from "@/lib/categorias";

interface CategoriaGridProps {
  categories: CategoriaConEstadisticas[];
  moneda: string;
}

function FilaCategoria({
  cat, moneda, onEditar, subcategoria = false, expandible = false, expandido = false, onToggleExpandir,
}: {
  cat: CategoriaConEstadisticas;
  moneda: string;
  onEditar: (id: string) => void;
  subcategoria?: boolean;
  expandible?: boolean;
  expandido?: boolean;
  onToggleExpandir?: () => void;
}) {
  return (
    <div
      onClick={expandible ? onToggleExpandir : undefined}
      className={cn(
        "group flex items-center justify-between gap-2",
        subcategoria ? "py-2 pl-4 border-t border-border/60" : "p-4",
        expandible && "cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold shrink-0",
            subcategoria ? "size-7 text-xs" : "size-9 text-sm"
          )}
          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
        >
          {cat.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={cn("font-medium truncate", subcategoria ? "text-xs" : "text-sm")}>{cat.nombre}</p>
          <p className="text-xs text-muted-foreground truncate">
            {cat._count.transacciones}{" "}
            {cat._count.transacciones === 1 ? "transacción" : "transacciones"}
            {cat.montoTotal > 0 && <> · {formatCurrency(cat.montoTotal, moneda)}</>}
            {expandible && (
              <> · {cat._count.subcategorias} subcategoría{cat._count.subcategorias !== 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onEditar(cat.id)}>
            <Pencil className="size-3.5" />
          </Button>
          <DeleteCategoryButton
            id={cat.id}
            cantidadTransacciones={cat._count.transacciones}
            cantidadSubcategorias={cat._count.subcategorias}
          />
        </div>
        {expandible && (
          <Button variant="ghost" size="icon" className="size-7" onClick={onToggleExpandir} title="Ver subcategorías">
            {expandido ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function GrupoCategoria({
  padre, hijos, moneda, onEditar,
}: {
  padre: CategoriaConEstadisticas;
  hijos: CategoriaConEstadisticas[];
  moneda: string;
  onEditar: (id: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const tieneHijos = hijos.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <FilaCategoria
        cat={padre}
        moneda={moneda}
        onEditar={onEditar}
        expandible={tieneHijos}
        expandido={expandido}
        onToggleExpandir={() => setExpandido((v) => !v)}
      />
      {tieneHijos && expandido && hijos.map((hijo) => (
        <FilaCategoria key={hijo.id} cat={hijo} moneda={moneda} onEditar={onEditar} subcategoria />
      ))}
    </div>
  );
}

function SeccionCategorias({
  titulo,
  items,
  tipo,
  onEditar,
  moneda,
}: {
  titulo: string;
  items: CategoriaConEstadisticas[];
  tipo: TipoTransaccion;
  onEditar: (id: string) => void;
  moneda: string;
}) {
  const grupos = agruparPorPadre(items);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
            tipo === TipoTransaccion.INGRESO
              ? "bg-income/10 text-income"
              : "bg-expense/10 text-expense"
          )}
        >
          {titulo}
        </span>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
        {grupos.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-2">
            Sin categorías todavía.
          </p>
        )}
        {grupos.map(({ padre, hijos }) => (
          <GrupoCategoria key={padre.id} padre={padre} hijos={hijos} moneda={moneda} onEditar={onEditar} />
        ))}
      </div>
    </div>
  );
}

export function CategoryGrid({ categories, moneda }: CategoriaGridProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const ingresos = categories.filter((c) => c.tipo === TipoTransaccion.INGRESO);
  const gastos = categories.filter((c) => c.tipo === TipoTransaccion.GASTO);
  const categoriaEditando = categories.find((c) => c.id === editandoId);

  return (
    <div className="space-y-8">
      <SeccionCategorias
        titulo="Ingresos"
        items={ingresos}
        tipo={TipoTransaccion.INGRESO}
        onEditar={setEditandoId}
        moneda={moneda}
      />
      <SeccionCategorias
        titulo="Gastos"
        items={gastos}
        tipo={TipoTransaccion.GASTO}
        onEditar={setEditandoId}
        moneda={moneda}
      />

      {categoriaEditando && (
        <EditCategoryDialog
          categoria={categoriaEditando}
          categoriasExistentes={categories}
          open={!!editandoId}
          onOpenChange={(o) => !o && setEditandoId(null)}
        />
      )}
    </div>
  );
}
