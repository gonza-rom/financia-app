// app/estadisticas/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCachedEstadisticas } from "@/features/estadisticas/queries";
import { EstadisticasContent } from "@/features/estadisticas/estadisticas-content";
import { SelectorMes } from "@/features/estadisticas/selector-mes";
import { ChartSkeleton } from "@/components/skeletons";

export const metadata: Metadata = { title: "Estadísticas" };

interface PageProps {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}

async function EstadisticasData({
  usuarioId,
  moneda,
  anio,
  mes,
}: {
  usuarioId: string;
  moneda: string;
  anio: number;
  mes: number;
}) {
  const datos = await getCachedEstadisticas(usuarioId, anio, mes);
  return <EstadisticasContent datos={datos} moneda={moneda} />;
}

export default async function EstadisticasPage({ searchParams }: PageProps) {
  const [usuario, params] = await Promise.all([getCurrentUser(), searchParams]);

  const ahora = new Date();
  const anio = Number(params.anio ?? ahora.getFullYear());
  const mes  = Number(params.mes  ?? ahora.getMonth() + 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análisis detallado de tus finanzas
          </p>
        </div>
        <SelectorMes anio={anio} mes={mes} />
      </div>

      {/* Contenido */}
      <Suspense
        key={`${anio}-${mes}`}
        fallback={
          <div className="space-y-6">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        }
      >
        <EstadisticasData
          usuarioId={usuario.id}
          moneda={usuario.moneda}
          anio={anio}
          mes={mes}
        />
      </Suspense>
    </div>
  );
}