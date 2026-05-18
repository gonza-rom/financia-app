// app/vehiculos/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getCachedVehiculos } from "@/features/vehiculos/queries";
import { VehiculosList } from "@/features/vehiculos/vehiculos-list";
import { NuevoVehiculoButton } from "@/features/vehiculos/nuevo-vehiculo-button";

export const metadata: Metadata = { title: "Vehículos" };

async function VehiculosData() {
  const usuario = await getCurrentUser();
  const vehiculos = await getCachedVehiculos(usuario.id);
  return <VehiculosList vehiculos={vehiculos} moneda={usuario.moneda} />;
}

export default function VehiculosPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehículos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Seguimiento de gastos por vehículo
          </p>
        </div>
        <NuevoVehiculoButton />
      </div>
      <Suspense fallback={<VehiculosListSkeleton />}>
        <VehiculosData />
      </Suspense>
    </div>
  );
}

function VehiculosListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="skeleton size-10 rounded-full" />
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-28 rounded-md" />
              <div className="skeleton h-3 w-20 rounded-md" />
            </div>
          </div>
          <div className="skeleton h-16 w-full rounded-lg" />
          <div className="skeleton h-8 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}