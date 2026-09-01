// features/dashboard/recordatorios-widget.tsx
import Link from "next/link";
import { BellRing, Car, Wrench, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recordatorio } from "./recordatorios-query";

const ICONOS: Record<Recordatorio["tipo"], React.ElementType> = {
  seguro: Car,
  service: Wrench,
  deuda: Landmark,
};

export function RecordatoriosWidget({ recordatorios }: { recordatorios: Recordatorio[] }) {
  if (recordatorios.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BellRing className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Recordatorios</h2>
      </div>

      <div className="space-y-1.5">
        {recordatorios.map((r, i) => {
          const Icono = ICONOS[r.tipo];
          return (
            <Link
              key={i}
              href={r.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50",
                r.vencido ? "bg-expense/5 border border-expense/20" : "bg-muted/30"
              )}
            >
              <div className={cn(
                "size-7 rounded-full flex items-center justify-center shrink-0",
                r.vencido ? "bg-expense/10 text-expense" : "bg-muted text-muted-foreground"
              )}>
                <Icono className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.titulo}</p>
                <p className={cn("text-xs truncate", r.vencido ? "text-expense" : "text-muted-foreground")}>
                  {r.subtitulo}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
