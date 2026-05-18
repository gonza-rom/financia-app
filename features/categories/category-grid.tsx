// features/categories/category-grid.tsx
"use client";

import type { CategoriaConEstadisticas } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryDialog } from "./edit-category-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CategoriaGridProps {
  categories: CategoriaConEstadisticas[];
  moneda: string;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-2">
            Sin categorías todavía.
          </p>
        )}
        {items.map((cat) => (
          <div
            key={cat.id}
            className="group rounded-xl border border-border bg-card p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                {cat.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{cat.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {cat._count.transacciones}{" "}
                  {cat._count.transacciones === 1 ? "transacción" : "transacciones"}
                  {cat.montoTotal > 0 && (
                    <> · {formatCurrency(cat.montoTotal, moneda)}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onEditar(cat.id)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <DeleteCategoryButton id={cat.id} cantidadTransacciones={cat._count.transacciones} />
            </div>
          </div>
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
          open={!!editandoId}
          onOpenChange={(o) => !o && setEditandoId(null)}
        />
      )}
    </div>
  );
}