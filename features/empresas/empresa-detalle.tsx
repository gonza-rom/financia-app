// features/empresas/empresa-detalle.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { EmpresaDetalle, ProyectoConCobros, CobroSerializado } from "@/types/empresas";
import type { Categoria } from "@/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Check, Trash2, ArrowLeft, TrendingUp, TrendingDown, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { confirmarCobroAction, eliminarCobroAction, actualizarEstadoProyectoAction } from "./actions";
import { NuevoProyectoDialog } from "./nuevo-proyecto-dialog";
import { NuevoClienteDialog } from "./nuevo-cliente-dialog";
import { NuevoCobroDialog } from "./nuevo-cobro-dialog";
import { NuevoGastoEmpresaDialog } from "./nuevo-gasto-empresa-dialog";

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: "bg-income/10 text-income",
  PAUSADO: "bg-amber-500/10 text-amber-400",
  COMPLETADO: "bg-primary/10 text-primary",
  CANCELADO: "bg-muted text-muted-foreground",
};

const ESTADO_LABELS: Record<string, string> = {
  ACTIVO: "Activo", PAUSADO: "Pausado", COMPLETADO: "Completado", CANCELADO: "Cancelado",
};

function CobroRow({
  cobro, empresaId, categorias, moneda,
}: {
  cobro: CobroSerializado;
  empresaId: string;
  categorias: Categoria[];
  moneda: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const { toast } = useToast();
  const cobrado = cobro.estado === "COBRADO";

  function handleEliminar() {
    if (!confirm("¿Eliminar este cobro?")) return;
    startTransition(async () => {
      const r = await eliminarCobroAction(cobro.id, empresaId);
      if (!r.success) toast({ variant: "destructive", title: "Error", description: r.error });
    });
  }

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 group", cobrado && "opacity-60")}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{cobro.descripcion}</p>
        <p className="text-xs text-muted-foreground">
          {cobro.fechaEstimada && <>Est. {formatShortDate(cobro.fechaEstimada)}</>}
          {cobro.fechaCobro && <> · Cobrado {formatShortDate(cobro.fechaCobro)}</>}
        </p>
      </div>
      <span className={cn("text-sm font-semibold tabular-nums", cobrado ? "text-income" : "text-muted-foreground")}>
        {formatCurrency(cobro.monto, moneda)}
      </span>
      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
        cobrado ? "bg-income/10 text-income" : "bg-amber-500/10 text-amber-400")}>
        {cobrado ? "Cobrado" : "Pendiente"}
      </span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!cobrado && (
          <Button variant="ghost" size="icon" className="size-7 text-income hover:text-income"
            onClick={() => setConfirmarOpen(true)} disabled={isPending} title="Confirmar cobro">
            <Check className="size-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
          onClick={handleEliminar} disabled={isPending}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {/* Dialog confirmar con opción de transferir */}
      {confirmarOpen && (
        <ConfirmarCobroDialog
          cobro={cobro} empresaId={empresaId} categorias={categorias} moneda={moneda}
          onClose={() => setConfirmarOpen(false)}
        />
      )}
    </div>
  );
}

function ConfirmarCobroDialog({
  cobro, empresaId, categorias, moneda, onClose,
}: {
  cobro: CobroSerializado;
  empresaId: string;
  categorias: Categoria[];
  moneda: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [transferir, setTransferir] = useState(true);
  const [categoriaId, setCategoriaId] = useState(categorias.find((c) => c.tipo === "INGRESO")?.id ?? "");
  const { toast } = useToast();
  const { Dialog, DialogContent, DialogHeader, DialogTitle } = require("@/components/ui/dialog");
  const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = require("@/components/ui/select");

  function handleConfirmar() {
    startTransition(async () => {
      const r = await confirmarCobroAction(cobro.id, empresaId, transferir, transferir ? categoriaId : undefined);
      if (!r.success) toast({ variant: "destructive", title: "Error", description: r.error });
      else { toast({ title: "Cobro confirmado" }); onClose(); }
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Confirmar cobro</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{cobro.descripcion}</p>
            <p className="text-lg font-semibold text-income mt-1">{formatCurrency(cobro.monto, moneda)}</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="transferir" checked={transferir}
              onChange={(e) => setTransferir(e.target.checked)} className="rounded" />
            <label htmlFor="transferir" className="text-sm">Transferir a finanzas personales</label>
          </div>
          {transferir && (
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger><SelectValue placeholder="Categoría de ingreso" /></SelectTrigger>
              <SelectContent>
                {categorias.filter((c) => c.tipo === "INGRESO").map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleConfirmar} disabled={isPending}>
              {isPending ? "Confirmando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProyectoCard({
  proyecto, empresaId, categorias, moneda,
}: {
  proyecto: ProyectoConCobros;
  empresaId: string;
  categorias: Categoria[];
  moneda: string;
}) {
  const [cobroOpen, setCobroOpen] = useState(false);
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="size-4 text-muted-foreground shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{proyecto.nombre}</p>
              <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full font-medium", ESTADO_COLORS[proyecto.estado])}>
                {ESTADO_LABELS[proyecto.estado]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {proyecto.cliente?.nombre && <>{proyecto.cliente.nombre} · </>}
              {proyecto.cobros.length} cobro{proyecto.cobros.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-income">{formatCurrency(proyecto.totalCobrado, moneda)}</p>
            {proyecto.totalPendiente > 0 && (
              <p className="text-xs text-amber-400">{formatCurrency(proyecto.totalPendiente, moneda)} pendiente</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setCobroOpen(true)} title="Agregar cobro">
            <Plus className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setExpandido(!expandido)}>
            <span className="text-xs">{expandido ? "▲" : "▼"}</span>
          </Button>
        </div>
      </div>

      {expandido && proyecto.cobros.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {proyecto.cobros.map((cobro) => (
            <CobroRow key={cobro.id} cobro={cobro} empresaId={empresaId} categorias={categorias} moneda={moneda} />
          ))}
        </div>
      )}

      <NuevoCobroDialog open={cobroOpen} onOpenChange={setCobroOpen} proyectoId={proyecto.id} empresaId={empresaId} />
    </div>
  );
}

export function EmpresaDetallePage({
  empresa, moneda, categorias,
}: {
  empresa: EmpresaDetalle;
  moneda: string;
  categorias: Categoria[];
}) {
  const [proyectoOpen, setProyectoOpen] = useState(false);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [gastoOpen, setGastoOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/empresas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" /> Volver a empresas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${empresa.color}20` }}>
            {empresa.logo ?? <Building2 className="size-6" style={{ color: empresa.color }} />}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{empresa.nombre}</h1>
            {empresa.descripcion && <p className="text-sm text-muted-foreground mt-0.5">{empresa.descripcion}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ingresos totales", valor: empresa.totalIngresos, clase: "text-income", icono: TrendingUp },
          { label: "Gastos totales", valor: empresa.totalGastos, clase: "text-expense", icono: TrendingDown },
          { label: "Ganancia neta", valor: empresa.gananciaNeta, clase: empresa.gananciaNeta >= 0 ? "text-income" : "text-expense", icono: null },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-xl font-semibold", s.clase)}>{formatCurrency(s.valor, moneda)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="proyectos">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="proyectos">
              <FolderOpen className="size-3.5 mr-1.5" /> Proyectos ({empresa.proyectos.length})
            </TabsTrigger>
            <TabsTrigger value="clientes">
              <Users className="size-3.5 mr-1.5" /> Clientes ({empresa.clientes.length})
            </TabsTrigger>
            <TabsTrigger value="gastos">
              <TrendingDown className="size-3.5 mr-1.5" /> Gastos ({empresa.gastos.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setClienteOpen(true)}>
              <Plus className="size-3.5" /> Cliente
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setGastoOpen(true)}>
              <Plus className="size-3.5" /> Gasto
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setProyectoOpen(true)}>
              <Plus className="size-3.5" /> Proyecto
            </Button>
          </div>
        </div>

        <TabsContent value="proyectos" className="mt-4 space-y-3">
          {empresa.proyectos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Sin proyectos todavía.</p>
            </div>
          ) : (
            empresa.proyectos.map((p) => (
              <ProyectoCard key={p.id} proyecto={p} empresaId={empresa.id} categorias={categorias} moneda={moneda} />
            ))
          )}
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          {empresa.clientes.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Sin clientes todavía.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {empresa.clientes.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.email ?? "Sin email"} · {c.proyectos.length} proyecto{c.proyectos.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-income">{formatCurrency(c.totalGenerado, moneda)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gastos" className="mt-4">
          {empresa.gastos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Sin gastos registrados.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {empresa.gastos.map((g) => (
                <div key={g.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{g.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{formatShortDate(g.fecha)}</p>
                  </div>
                  <p className="text-sm font-semibold text-expense">{formatCurrency(g.monto, moneda)}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NuevoProyectoDialog open={proyectoOpen} onOpenChange={setProyectoOpen} empresaId={empresa.id} clientes={empresa.clientes} />
      <NuevoClienteDialog open={clienteOpen} onOpenChange={setClienteOpen} empresaId={empresa.id} />
      <NuevoGastoEmpresaDialog open={gastoOpen} onOpenChange={setGastoOpen} empresaId={empresa.id} categorias={categorias} moneda={moneda} />
    </div>
  );
}