// features/deudas/contraparte-card.tsx
"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown, ChevronUp, Plus, Building2, User,
  CheckCircle2, Clock, AlertCircle, MoreHorizontal,
  Calendar, Trash2, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  marcarDeudaPagada,
  marcarDeudaVencida,
  marcarCuotaPagada,
  eliminarDeuda,
} from "@/features/deudas/actions";
import { DeudaFormDialog } from "@/features/deudas/deuda-form-dialog";
import { PagoDialog } from "@/features/deudas/pago-dialog";
import type { Deuda, EstadoDeuda } from "@/types/deudas";
import type { Categoria } from "@/types";

// ─── Config de estados ────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoDeuda, { label: string; icon: React.ElementType; pill: string }> = {
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

// ─── Dialog para marcar como pagada con categoría ─────────────────────────────

interface MarcarPagadaDialogProps {
  deuda: Deuda;
  categorias: Categoria[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MarcarPagadaDialog({ deuda, categorias, open, onOpenChange }: MarcarPagadaDialogProps) {
  const [categoriaId, setCategoriaId] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const montoRestante = deuda.montoTotal - (deuda.montoPagado ?? 0);

  const categoriasRelevantes = categorias.filter((c) =>
    deuda.tipo === "cobrar"
      ? c.tipo === "INGRESO"
      : c.tipo === "GASTO"
  );

  function handleConfirmar() {
    startTransition(async () => {
      const res = await marcarDeudaPagada(deuda.id, categoriaId);
      if (res.success) {
        toast({ title: "Deuda marcada como pagada ✓" });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como pagada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deuda con</span>
              <span className="font-medium">{deuda.contraparte}</span>
            </div>
            {montoRestante > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monto restante</span>
                <span className="font-semibold">{fmt(montoRestante, deuda.moneda)}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Registrar en finanzas{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            {categoriasRelevantes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Creá una categoría de {deuda.tipo === "cobrar" ? "ingreso" : "gasto"} para vincular el pago.
              </p>
            ) : (
              <Select onValueChange={(v) => setCategoriaId(v === "ninguna" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría (no registra transacción)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Sin categoría</SelectItem>
                  {categoriasRelevantes.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {categoriaId && montoRestante > 0 && (
              <p className="text-xs text-muted-foreground">
                Se creará una transacción de{" "}
                <span className="font-medium">
                  {fmt(montoRestante, deuda.moneda)}
                </span>{" "}
                en tu historial.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={isPending}>
            {isPending ? "Guardando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fila de una deuda individual ─────────────────────────────────────────────

function DeudaRow({ deuda, categorias }: { deuda: Deuda; categorias: Categoria[] }) {
  const [cuotasOpen, setCuotasOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [marcarPagadaOpen, setMarcarPagadaOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const cfg = ESTADO_CONFIG[deuda.estado];
  const EstadoIcon = cfg.icon;

  const cuotasPagadas = deuda.cuotas?.filter((c) => c.pagada).length ?? 0;
  const totalCuotas   = deuda.cuotas?.length ?? 0;
  const progreso      = totalCuotas > 0 ? (cuotasPagadas / totalCuotas) * 100 : 0;
  const proximaCuota  = deuda.cuotas?.find((c) => !c.pagada);

  const saldoPendiente = deuda.montoTotal - (deuda.montoPagado ?? 0);
  const porcentajePagado = deuda.montoTotal > 0
    ? ((deuda.montoPagado ?? 0) / deuda.montoTotal) * 100
    : 0;
  const tienePagosParciales = !totalCuotas && (deuda.montoPagado ?? 0) > 0;

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
    <>
      <div className={cn(
        "rounded-lg border bg-background transition-shadow",
        deuda.estado === "vencida" && "border-rose-200 dark:border-rose-900/50",
        isPending && "opacity-60 pointer-events-none"
      )}>
        <div className="flex items-start gap-3 px-3 py-2.5">
          <span className={cn(
            "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            deuda.tipo === "cobrar"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          )}>
            {deuda.tipo === "cobrar" ? "Cobra" : "Paga"}
          </span>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {deuda.descripcion ? (
                <span className="text-sm font-medium truncate">{deuda.descripcion}</span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Sin descripción</span>
              )}
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                cfg.pill
              )}>
                <EstadoIcon className="size-2.5" />
                {cfg.label}
              </span>
            </div>

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
            ) : (
              <div className="space-y-1">
                {tienePagosParciales && (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Pagado: {fmt(deuda.montoPagado ?? 0, deuda.moneda)}</span>
                      <span>Saldo: {fmt(saldoPendiente, deuda.moneda)}</span>
                    </div>
                    <Progress value={porcentajePagado} className="h-1" />
                  </>
                )}
                {deuda.fechaVencimiento && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    Vence el {fmtDate(deuda.fechaVencimiento)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="text-right">
              <span className="text-sm font-semibold tabular-nums block">
                {fmt(deuda.montoTotal, deuda.moneda)}
              </span>
              {tienePagosParciales && deuda.estado !== "pagada" && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  resta {fmt(saldoPendiente, deuda.moneda)}
                </span>
              )}
            </div>

            {totalCuotas > 0 && (
              <button
                type="button"
                onClick={() => setCuotasOpen((v) => !v)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {cuotasOpen
                  ? <ChevronUp className="size-3.5" />
                  : <ChevronDown className="size-3.5" />}
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {deuda.estado !== "pagada" && !totalCuotas && (
                  <DropdownMenuItem onClick={() => setPagoOpen(true)}>
                    <Wallet className="size-3.5 mr-2 text-blue-500" />
                    Registrar pago parcial
                  </DropdownMenuItem>
                )}
                {deuda.estado !== "pagada" && (
                  <DropdownMenuItem onClick={() => setMarcarPagadaOpen(true)}>
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
                  <CheckCircle2 className={cn(
                    "size-4 shrink-0",
                    cuota.pagada ? "text-emerald-500" : "text-muted-foreground/30"
                  )} />
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

      <PagoDialog
        deuda={deuda}
        categorias={categorias}
        open={pagoOpen}
        onOpenChange={setPagoOpen}
      />

      <MarcarPagadaDialog
        deuda={deuda}
        categorias={categorias}
        open={marcarPagadaOpen}
        onOpenChange={setMarcarPagadaOpen}
      />
    </>
  );
}

// ─── Card de contraparte ──────────────────────────────────────────────────────

interface ContraparteCardProps {
  nombre: string;
  empresaId?: string;
  deudas: Deuda[];
  categorias: Categoria[];
}

export function ContraparteCard({ nombre, empresaId, deudas, categorias }: ContraparteCardProps) {
  const [open, setOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const moneda = deudas[0]?.moneda ?? "ARS";
  const tieneVencidas = deudas.some((d) => d.estado === "vencida");
  const pendientes = deudas.filter((d) => d.estado !== "pagada").length;

  const saldo = deudas
    .filter((d) => d.estado !== "pagada")
    .reduce((acc, d) => {
      const saldoDeuda = d.montoTotal - (d.montoPagado ?? 0);
      return acc + (d.tipo === "cobrar" ? saldoDeuda : -saldoDeuda);
    }, 0);

  return (
    <>
      <div className={cn(
        "rounded-xl border bg-card overflow-hidden",
        tieneVencidas && "border-rose-200 dark:border-rose-900/50"
      )}>
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
              {" · "}{deudas.length} total
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className={cn(
              "text-sm font-bold tabular-nums",
              saldo > 0 ? "text-emerald-600 dark:text-emerald-400"
                : saldo < 0 ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground"
            )}>
              {saldo > 0 ? "+" : saldo < 0 ? "−" : ""}
              {fmt(saldo, moneda)}
            </p>
            <p className="text-[10px] text-muted-foreground">saldo neto</p>
          </div>

          {open
            ? <ChevronUp className="size-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="size-4 text-muted-foreground shrink-0" />}
        </button>

        {open && (
          <div className="border-t border-border px-3 py-2 space-y-2">
            {deudas.map((d) => (
              <DeudaRow key={d.id} deuda={d} categorias={categorias} />
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
        categorias={categorias}
      />
    </>
  );
}