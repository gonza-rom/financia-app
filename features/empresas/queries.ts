// features/empresas/queries.ts
import { prisma } from "@/lib/prisma";
import type { EmpresaResumen, EmpresaDetalle, ProyectoConCobros } from "@/types/empresas";
import { unstable_cache } from "next/cache";

export const getCachedEmpresas = unstable_cache(
  async (usuarioId: string): Promise<EmpresaResumen[]> => {
    const empresas = await prisma.empresa.findMany({
      where: { usuarioId, activo: true },
      include: {
        clientes: true,
        _count: { select: { proyectos: true, clientes: true } },
      },
      orderBy: { creadoEn: "desc" },
    });

    const resumen = await Promise.all(
      empresas.map(async (e) => {
        const [ingresos, gastos] = await Promise.all([
          prisma.cobroProyecto.aggregate({
            where: { proyecto: { empresaId: e.id }, estado: "COBRADO" },
            _sum: { monto: true },
          }),
          prisma.gastoEmpresa.aggregate({
            where: { empresaId: e.id },
            _sum: { monto: true },
          }),
        ]);

        const totalIngresos = Number(ingresos._sum.monto ?? 0);
        const totalGastos = Number(gastos._sum.monto ?? 0);

        return {
          ...e,
          totalIngresos,
          totalGastos,
          gananciaNeta: totalIngresos - totalGastos,
        };
      })
    );

    return resumen;
  },
  ["empresas"],
  { revalidate: 60, tags: ["empresas"] }
);

function serializarProyecto(p: any): ProyectoConCobros {
  const cobros = p.cobros.map((c: any) => ({ ...c, monto: Number(c.monto) }));
  const totalCobrado = cobros
    .filter((c: any) => c.estado === "COBRADO")
    .reduce((acc: number, c: any) => acc + c.monto, 0);
  const totalPendiente = cobros
    .filter((c: any) => c.estado === "PENDIENTE")
    .reduce((acc: number, c: any) => acc + c.monto, 0);

  return {
    ...p,
    montoTotal: p.montoTotal ? Number(p.montoTotal) : null,
    cobros,
    totalCobrado,
    totalPendiente,
  };
}

export async function getEmpresaDetalle(
  empresaId: string,
  usuarioId: string
): Promise<EmpresaDetalle | null> {
  const empresa = await prisma.empresa.findFirst({
    where: { id: empresaId, usuarioId, activo: true },
    include: {
      clientes: {
        include: {
          proyectos: {
            include: { cobros: true, cliente: true },
            orderBy: { creadoEn: "desc" },
          },
        },
      },
      proyectos: {
        include: { cobros: true, cliente: true },
        orderBy: { creadoEn: "desc" },
      },
      gastos: { orderBy: { fecha: "desc" } },
    },
  });

  if (!empresa) return null;

  const proyectos = empresa.proyectos.map(serializarProyecto);
  const gastos = empresa.gastos.map((g) => ({ ...g, monto: Number(g.monto) }));

  const clientes = empresa.clientes.map((c) => ({
    ...c,
    proyectos: c.proyectos.map(serializarProyecto),
    totalGenerado: c.proyectos
      .flatMap((p) => p.cobros)
      .filter((c) => c.estado === "COBRADO")
      .reduce((acc, c) => acc + Number(c.monto), 0),
  }));

  const totalIngresos = proyectos
    .flatMap((p) => p.cobros)
    .filter((c) => c.estado === "COBRADO")
    .reduce((acc, c) => acc + c.monto, 0);

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  return {
    ...empresa,
    proyectos,
    clientes,
    gastos,
    totalIngresos,
    totalGastos,
    gananciaNeta: totalIngresos - totalGastos,
  };
}