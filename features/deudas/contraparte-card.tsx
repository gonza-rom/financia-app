// features/deudas/contraparte-card.tsx
"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown, ChevronUp, Plus, Building2, User,
  CheckCircle2, Clock, AlertCircle, MoreHorizontal,
  Calendar, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  marcarDeudaPagada,
  marcarDeudaVencida,
  marcarCuotaPagada,
  eliminarDeuda,
} from "@/features/deudas/actions";
import { DeudaFormDialog } from "@/features/deudas/deuda-form-dialog";
import type { Deuda, EstadoDeuda } from "@/types/deudas";

// ─── Config de estados ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<
  EstadoDeuda,
  { label: string; icon: React.ElementType; pill: string }
> = {
  pendiente: {
    label: "Pendiente",
    icon: Clock,
    pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  pagada: {
    label: "Pagada",
    icon: CheckCircle2,
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  vencida: {
    label: "Vencida",
    icon: AlertCircle,
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

// ─── Helpers de formato ───────────────────────────────────────────────────────

function fmt(amount: number, moneda: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Fila de una deuda individual ─────────────────────────────────────────────

function DeudaRow({ deuda }: { deuda: Deuda }) {
  const [cuotasOpen, setCuotasOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const cfg = ESTADO_CONFIG[deuda.estado];
  const EstadoIcon = cfg.icon;

  const cuotasPagadas = deuda.cuotas?.filter((c) => c.pagada).length ?? 0;
  const totalCuotas   = deuda.cuotas?.length ?? 0;
  const progreso      = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
  const proximaCuota  = deuda.cuotas?.find((c) => !c.pagada);

  function handleMarcarPagada() {
    startTransition(async () => {
      const res = await marcarDeudaPagada(deuda.id);
      if (!res.success) toast({ variant: "destructive", title: res.error });
    });
  }

  function handleMarcarVencida() {
    startTransition(async () => {
      const res = await marcarDeudaVencida(deuda.id);
      if (!res.success) toast({ variant: "destructive", title: res.error });
    });
  }

  function handleEliminar() {
    startTransition(async () => {
      const res = await eliminarDeuda(deuda.id);
      if (!res.success) toast({ variant: "destructive", title: res.error });
    });
  }

  function handleCuota(cuotaId: string) {
    startTransition(async () => {
      const res = await marcarCuotaPagada(cuotaId, deuda.id);
      if (!res.success) toast({ variant: "destructive", title: res.error });
    });
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background transition-shadow",
        deuda.estado === "vencida" && "border-rose-200 dark:border-rose-900/50",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* Fila principal */}
      <div className="flex items-start gap-3 px-3 py-2.5">

        {/* Pill tipo */}
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            deuda.tipo === "cobrar"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          )}
        >
          {deuda.tipo === "cobrar" ? "Cobra" : "Paga"}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {deuda.descripcion ? (
              <span className="text-sm font-medium truncate">{deuda.descripcion}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic">Sin descripción</span>
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                cfg.pill
              )}
            >
              <EstadoIcon className="size-2.5" />
              {cfg.label}
            </span>
          </div>

          {/* Fecha / cuotas */}
          {totalCuotas > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{cuotasPagadas} de {totalCuotas} cuotas pagadas</span>
                {proximaCuota?.fechaVencimiento && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    Próxima: {fmtDate(proximaCuota.fechaVencimiento)}
                  </span>
                )}
              </div>
              <Progress value={progreso} className="h-1" />
            </div>
          ) : deuda.fechaVencimiento ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              Vence el {fmtDate(deuda.fechaVencimiento)}
            </div>
          ) : null}
        </div>

        {/* Monto + acciones */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm font-semibold tabular-nums">
            {fmt(deuda.montoTotal, deuda.moneda)}
          </span>

          {/* Expandir cuotas */}
          {totalCuotas > 0 && (
            <button
              type="button"
              onClick={() => setCuotasOpen((v) => !v)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={cuotasOpen ? "Ocultar cuotas" : "Ver cuotas"}
            >
              {cuotasOpen
                ? <ChevronUp className="size-3.5" />
                : <ChevronDown className="size-3.5" />}
            </button>
          )}

          {/* Menú de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {deuda.estado !== "pagada" && (
                <DropdownMenuItem onClick={handleMarcarPagada}>
                  <CheckCircle2 className="size-3.5 mr-2 text-emerald-500" />
                  Marcar como pagada
                </DropdownMenuItem>
              )}
              {deuda.estado === "pendiente" && (
                <DropdownMenuItem onClick={handleMarcarVencida}>
                  <AlertCircle className="size-3.5 mr-2 text-rose-500" />
                  Marcar como vencida
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleEliminar}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Panel de cuotas */}
      {cuotasOpen && deuda.cuotas && (
        <div className="border-t border-border px-3 py-2 space-y-1">
          {deuda.cuotas.map((cuota) => (
            <button
              key={cuota.id}
              type="button"
              disabled={cuota.pagada || isPending}
              onClick={() => !cuota.pagada && handleCuota(cuota.id)}
              className={cn(
                "w-full flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors",
                cuota.pagada ? "cursor-default" : "hover:bg-muted cursor-pointer"
              )}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={cn(
                    "size-4 shrink-0",
                    cuota.pagada ? "text-emerald-500" : "text-muted-foreground/30"
                  )}
                />
                <span className={cn(cuota.pagada && "line-through text-muted-foreground")}>
                  Cuota {cuota.numero}
                </span>
                {!cuota.pagada && cuota.fechaVencimiento && (
                  <span className="text-xs text-muted-foreground">
                    · {fmtDate(cuota.fechaVencimiento)}
                  </span>
                )}
                {cuota.pagada && cuota.fechaPago && (
                  <span className="text-xs text-muted-foreground">
                    · pagada {fmtDate(cuota.fechaPago)}
                  </span>
                )}
              </div>
              <span className={cn("tabular-nums", cuota.pagada && "text-muted-foreground")}>
                {fmt(cuota.monto, deuda.moneda)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card de contraparte (agrupadora) ─────────────────────────────────────────

interface ContraparteCardProps {
  nombre: string;
  empresaId?: string;
  deudas: Deuda[];
}

export function ContraparteCard({ nombre, empresaId, deudas }: ContraparteCardProps) {
  const [open, setOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const moneda = deudas[0]?.moneda ?? "ARS";
  const tieneVencidas = deudas.some((d) => d.estado === "vencida");
  const pendientes = deudas.filter((d) => d.estado !== "pagada").length;

  const saldo = deudas
    .filter((d) => d.estado !== "pagada")
    .reduce((acc, d) => acc + (d.tipo === "cobrar" ? d.montoTotal : -d.montoTotal), 0);

  return (
    <>
      <div
        className={cn(
          "rounded-xl border bg-card overflow-hidden",
          tieneVencidas && "border-rose-200 dark:border-rose-900/50"
        )}
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="rounded-lg bg-muted p-2 shrink-0">
            {empresaId
              ? <Building2 className="size-4 text-muted-foreground" />
              : <User className="size-4 text-muted-foreground" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{nombre}</span>
              {tieneVencidas && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  <AlertCircle className="size-2.5" />
                  Vencida
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendientes} deuda{pendientes !== 1 ? "s" : ""} activa{pendientes !== 1 ? "s" : ""}
              {" · "}
              {deudas.length} total
            </p>
          </div>

          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                saldo > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : saldo < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              )}
            >
              {saldo > 0 ? "+" : saldo < 0 ? "−" : ""}
              {fmt(saldo, moneda)}
            </p>
            <p className="text-[10px] text-muted-foreground">saldo neto</p>
          </div>

          {open
            ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
        </button>

        {/* Lista de deudas */}
        {open && (
          <div className="border-t border-border px-3 py-2 space-y-2">
            {deudas.map((d) => (
              <DeudaRow key={d.id} deuda={d} />
            ))}
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Plus className="size-3.5" />
              Agregar deuda a {nombre}
            </button>
          </div>
        )}
      </div>

      <DeudaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        contraparteInicial={nombre}
        empresaIdInicial={empresaId}
      />
    </>
  );
}