// app/vehiculos/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getVehiculoConSecciones } from "@/features/vehiculos/queries";
import { SeccionCard } from "@/features/vehiculos/seccion-card";
import { NuevaSeccionDialogWrapper } from "@/features/vehiculos/nueva-seccion-dialog-wrapper";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Car, Gauge } from "lucide-react";
import { getCategorias } from "@/features/categories/queries";  // ← cambiar

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const usuario = await getCurrentUser();
  const vehiculo = await getVehiculoConSecciones(id, usuario.id);
  return { title: vehiculo ? vehiculo.nombre : "Vehículo" };
}

export default async function VehiculoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const usuario = await getCurrentUser();
  const [vehiculo, categorias] = await Promise.all([   // ← agregar
    getVehiculoConSecciones(id, usuario.id),
     getCategorias(usuario.id),                   // ← agregar
  ]);

  if (!vehiculo) notFound();

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/vehiculos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver a vehículos
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="size-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${vehiculo.color}20`, color: vehiculo.color }}
          >
            <Car className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{vehiculo.nombre}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {vehiculo.marca} {vehiculo.modelo} · {vehiculo.anio}
              {vehiculo.patente && ` · ${vehiculo.patente}`}
            </p>
          </div>
        </div>
        <NuevaSeccionDialogWrapper vehiculoId={vehiculo.id} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total gastado</p>
          <p className="text-xl font-semibold">
            {formatCurrency(vehiculo.totalGastado, usuario.moneda)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Gauge className="size-3" /> Kilometraje
          </p>
          <p className="text-xl font-semibold">
            {vehiculo.kilometraje?.toLocaleString("es-AR") ?? "—"} km
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Secciones</p>
          <p className="text-xl font-semibold">{vehiculo.secciones.length}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3">Secciones de gasto</h2>
        {vehiculo.secciones.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">Sin secciones todavía.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Usá el botón &quot;Nueva sección&quot; para agregar una.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehiculo.secciones.map((seccion) => (
              <SeccionCard
                key={seccion.id}
                vehiculoId={vehiculo.id}
                seccion={seccion}
                moneda={usuario.moneda}
                categorias={categorias}   // ← agregar
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}