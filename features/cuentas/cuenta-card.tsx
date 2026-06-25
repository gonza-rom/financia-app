// features/cuentas/cuenta-card.tsx
"use client";

import { useState } from "react";
import {
  Wallet, Banknote, Landmark, CreditCard, TrendingUp, Circle,
  MoreHorizontal, Pencil, Trash2, ArrowRightLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CuentaConStats } from "@/types/cuentas";
import { EditarCuentaDialog } from "./editar-cuenta-dialog";
import { AjustarSaldoDialog } from "./ajustar-saldo-dialog";
import { EliminarCuentaButton } from "./eliminar-cuenta-button";

const ICONOS: Record<string, React.ElementType> = {
  banknote: Banknote,
  wallet: Wallet,
  landmark: Landmark,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
  circle: Circle,
};

interface CuentaCardProps {
  cuenta: CuentaConStats;
  moneda: string;
}

export function CuentaCard({ cuenta, moneda }: CuentaCardProps) {
  const [editarOpen, setEditarOpen] = useState(false);
  const [ajustarOpen, setAjustarOpen] = useState(false);
  const Icono = ICONOS[cuenta.icono] ?? Circle;
  const saldo = Number(cuenta.saldo);
  const esNegativo = saldo < 0;

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden group">
        {/* Barra superior de color */}
        <div className="h-1.5 w-full" style={{ backgroundColor: cuenta.color }} />

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cuenta.color}20`, color: cuenta.color }}
              >
                <Icono className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{cuenta.nombre}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {cuenta.tipo.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setAjustarOpen(true)}>
                  <ArrowRightLeft className="size-3.5 mr-2 text-blue-500" />
                  Ajustar saldo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditarOpen(true)}>
                  <Pencil className="size-3.5 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <EliminarCuentaButton id={cuenta.id} tieneTransacciones={(cuenta._count?.transacciones ?? 0) > 0} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Saldo actual</p>
            <p className={cn(
              "text-2xl font-semibold tracking-tight tabular-nums",
              esNegativo && "text-expense"
            )}>
              {formatCurrency(saldo, moneda)}
            </p>
          </div>

          {cuenta._count !== undefined && (
            <p className="text-xs text-muted-foreground">
              {cuenta._count.transacciones} transacción{cuenta._count.transacciones !== 1 ? "es" : ""}
            </p>
          )}
        </div>
      </div>

      <EditarCuentaDialog cuenta={cuenta} open={editarOpen} onOpenChange={setEditarOpen} />
      <AjustarSaldoDialog cuenta={cuenta} moneda={moneda} open={ajustarOpen} onOpenChange={setAjustarOpen} />
    </>
  );
}