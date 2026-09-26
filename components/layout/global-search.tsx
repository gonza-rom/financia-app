// components/layout/global-search.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowLeftRight, Landmark, Building2, Car, Loader2 } from "lucide-react";
import { buscarGlobal, type ResultadoBusqueda } from "@/features/search/actions";
import { formatCurrency, formatShortDate, cn } from "@/lib/utils";
import { useGlobalSearchOpen } from "@/hooks/use-global-search";

const VACIO: ResultadoBusqueda = { transacciones: [], deudas: [], empresas: [], vehiculos: [] };

interface GlobalSearchProps {
  moneda: string;
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function Resultado({
  icono: Icono, titulo, subtitulo, extra, onClick,
}: {
  icono: React.ElementType;
  titulo: string;
  subtitulo?: string;
  extra?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
    >
      <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        <Icono className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-muted-foreground truncate">{subtitulo}</p>}
      </div>
      {extra && <span className="text-sm font-medium tabular-nums shrink-0">{extra}</span>}
    </button>
  );
}

export function GlobalSearch({ moneda }: GlobalSearchProps) {
  const [open, setOpen] = useGlobalSearchOpen();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda>(VACIO);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Atajo global — Ctrl/Cmd+K abre o cierra desde cualquier pantalla.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResultados(VACIO);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResultados(VACIO);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const r = await buscarGlobal(q);
        setResultados(r);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function ir(href: string) {
    setOpen(false);
    router.push(href);
  }

  const hayResultados =
    resultados.transacciones.length > 0 ||
    resultados.deudas.length > 0 ||
    resultados.empresas.length > 0 ||
    resultados.vehiculos.length > 0;

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 sm:max-w-lg overflow-hidden">
          <DialogTitle className="sr-only">Buscar</DialogTitle>

          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar transacciones, deudas, empresas, vehículos…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />}
          </div>

          <div className={cn("overflow-y-auto p-2", (query.trim().length >= 2) && "max-h-96")}>
            {query.trim().length < 2 ? (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                Escribí al menos 2 letras para buscar.
              </p>
            ) : !hayResultados && !isPending ? (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">Sin resultados.</p>
            ) : (
              <>
                {resultados.transacciones.length > 0 && (
                  <Grupo titulo="Transacciones">
                    {resultados.transacciones.map((t) => (
                      <Resultado
                        key={t.id}
                        icono={ArrowLeftRight}
                        titulo={t.descripcion}
                        subtitulo={formatShortDate(t.fecha)}
                        extra={formatCurrency(t.monto, moneda)}
                        onClick={() => ir(`/transactions?busqueda=${encodeURIComponent(t.descripcion)}`)}
                      />
                    ))}
                  </Grupo>
                )}

                {resultados.deudas.length > 0 && (
                  <Grupo titulo="Deudas">
                    {resultados.deudas.map((d) => (
                      <Resultado
                        key={d.id}
                        icono={Landmark}
                        titulo={d.contraparte}
                        subtitulo={d.descripcion ?? (d.tipo === "COBRAR" ? "Te deben" : "Debés")}
                        onClick={() => ir("/deudas")}
                      />
                    ))}
                  </Grupo>
                )}

                {resultados.empresas.length > 0 && (
                  <Grupo titulo="Empresas">
                    {resultados.empresas.map((e) => (
                      <Resultado
                        key={e.id}
                        icono={Building2}
                        titulo={e.nombre}
                        subtitulo={e.tipo === "proyecto" ? `Proyecto · ${e.empresaNombre}` : "Empresa"}
                        onClick={() => ir(`/empresas/${e.tipo === "proyecto" ? e.empresaId : e.id}`)}
                      />
                    ))}
                  </Grupo>
                )}

                {resultados.vehiculos.length > 0 && (
                  <Grupo titulo="Vehículos">
                    {resultados.vehiculos.map((v) => (
                      <Resultado
                        key={v.id}
                        icono={Car}
                        titulo={v.nombre}
                        subtitulo={v.detalle}
                        onClick={() => ir(`/vehiculos/${v.id}`)}
                      />
                    ))}
                  </Grupo>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
  );
}
