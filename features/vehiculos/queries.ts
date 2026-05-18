// features/vehiculos/queries.ts
import { prisma } from "@/lib/prisma";
import type { VehiculoResumen, VehiculoConSecciones, SeccionConGastos } from "@/types/vehiculos";
import { unstable_cache } from "next/cache";

export const getCachedVehiculos = unstable_cache(
  async (usuarioId: string): Promise<VehiculoResumen[]> => {
    const vehiculos = await prisma.vehiculo.findMany({
      where: { usuarioId, activo: true },
      include: {
        secciones: { orderBy: { orden: "asc" } },
        _count: { select: { gastos: true } },
      },
      orderBy: { creadoEn: "desc" },
    });

    const totales = await prisma.gastoVehiculo.groupBy({
      by: ["vehiculoId"],
      where: { vehiculo: { usuarioId } },
      _sum: { monto: true },
    });

    return vehiculos.map((v) => ({
      ...v,
      totalGastado: Number(
        totales.find((t) => t.vehiculoId === v.id)?._sum.monto ?? 0
      ),
    }));
  },
  ["vehiculos"],
  { revalidate: 60, tags: ["vehiculos"] }
);

export async function getVehiculoConSecciones(
  vehiculoId: string,
  usuarioId: string
): Promise<VehiculoConSecciones | null> {
  const vehiculo = await prisma.vehiculo.findFirst({
    where: { id: vehiculoId, usuarioId, activo: true },
    include: {
      secciones: {
        orderBy: { orden: "asc" },
        include: {
          _count: { select: { gastos: true } },
          gastos: {
            orderBy: { fecha: "desc" },
            take: 5,
          },
        },
      },
      _count: { select: { gastos: true } },
    },
  });

  if (!vehiculo) return null;

  const totalesPorSeccion = await prisma.gastoVehiculo.groupBy({
    by: ["seccionId"],
    where: { vehiculoId },
    _sum: { monto: true },
  });

  const totalVehiculo = await prisma.gastoVehiculo.aggregate({
    where: { vehiculoId },
    _sum: { monto: true },
  });

  const secciones: SeccionConGastos[] = vehiculo.secciones.map((s) => ({
    ...s,
    totalGastado: Number(
      totalesPorSeccion.find((t) => t.seccionId === s.id)?._sum.monto ?? 0
    ),
  }));

  return {
    ...vehiculo,
    secciones,
    totalGastado: Number(totalVehiculo._sum.monto ?? 0),
  };
}

export async function getGastosSeccion(seccionId: string, pagina = 1, limite = 20) {
  const skip = (pagina - 1) * limite;
  const [gastos, total] = await prisma.$transaction([
    prisma.gastoVehiculo.findMany({
      where: { seccionId },
      orderBy: { fecha: "desc" },
      skip,
      take: limite,
    }),
    prisma.gastoVehiculo.count({ where: { seccionId } }),
  ]);
  return { gastos, total, totalPaginas: Math.ceil(total / limite) };
}