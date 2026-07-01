// features/estadisticas/selector-mes.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectorMesProps {
  anio: number;
  mes: number; // 1-12
}

export function SelectorMes({ anio, mes }: SelectorMesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const label = new Date(anio, mes - 1, 1).toLocaleString("es-AR", {
    month: "long",
    year: "numeric",
  });

  function navigate(delta: number) {
    let nuevoMes  = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 1)  { nuevoMes = 12; nuevoAnio--; }
    if (nuevoMes > 12) { nuevoMes = 1;  nuevoAnio++; }

    const hoy = new Date();
    if (nuevoAnio > hoy.getFullYear() || (nuevoAnio === hoy.getFullYear() && nuevoMes > hoy.getMonth() + 1)) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", String(nuevoAnio));
    params.set("mes",  String(nuevoMes));
    router.push(`?${params.toString()}`);
  }

  const hoy = new Date();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="size-8" onClick={() => navigate(-1)}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm font-medium capitalize min-w-[140px] text-center">{label}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        onClick={() => navigate(1)}
        disabled={esMesActual}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}