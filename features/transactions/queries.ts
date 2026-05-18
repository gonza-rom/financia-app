// features/transactions/queries.ts
import { prisma } from "@/lib/prisma";
import type { ResultadoPaginado, TransaccionConCategoria } from "@/types";
import { TipoTransaccion } from "@prisma/client";
import { unstable_cache } from "next/cache";

export type ParamsTransacciones = {
  pagina?: number;
  limite?: number;
  tipo?: TipoTransaccion;
  categoriaId?: string;
  busqueda?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
};

// Sin cache — siempre fresca (para la lista paginada con filtros)
export async function getTransacciones(
  usuarioId: string,
  params: ParamsTransacciones = {}
): Promise<ResultadoPaginado<TransaccionConCategoria>> {
  const { pagina = 1, limite = 20, tipo, categoriaId, busqueda, fechaDesde, fechaHasta } = params;
  const skip = (pagina - 1) * limite;

  const where = {
    usuarioId,
    ...(tipo && { tipo }),
    ...(categoriaId && { categoriaId }),
    ...(busqueda && { descripcion: { contains: busqueda, mode: "insensitive" as const } }),
    ...((fechaDesde || fechaHasta) ? {
      fecha: {
        ...(fechaDesde && { gte: fechaDesde }),
        ...(fechaHasta && { lte: fechaHasta }),
      },
    } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.transaccion.findMany({
      where,
      include: { categoria: true },
      orderBy: { fecha: "desc" },
      skip,
      take: limite,
    }),
    prisma.transaccion.count({ where }),
  ]);

  return {
    data: data.map((tx) => ({ ...tx, monto: Number(tx.monto) })),
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}

// Con cache — para el dashboard (las 8 más recientes)
export const getTransaccionesRecientes = unstable_cache(
  async (usuarioId: string, limite = 8) => {
    const txs = await prisma.transaccion.findMany({
      where: { usuarioId },
      include: { categoria: true },
      orderBy: { fecha: "desc" },
      take: limite,
    });
    return txs.map((tx) => ({ ...tx, monto: Number(tx.monto) }));
  },
  ["transacciones-recientes"],
  { revalidate: 30, tags: ["transacciones"] }
);

// Desglose por categoría con cache
export const getCachedCategoryBreakdown = unstable_cache(
  async (usuarioId: string, anio: number, mes: number, tipo: TipoTransaccion) => {
    const desde = new Date(anio, mes - 1, 1);
    const hasta = new Date(anio, mes, 0, 23, 59, 59);

    const resultado = await prisma.transaccion.groupBy({
      by: ["categoriaId"],
      where: { usuarioId, tipo, fecha: { gte: desde, lte: hasta } },
      _sum: { monto: true },
      _count: true,
      orderBy: { _sum: { monto: "desc" } },
    });

    const categorias = await prisma.categoria.findMany({
      where: { id: { in: resultado.map((r) => r.categoriaId) } },
    });

    const total = resultado.reduce((acc, r) => acc + Number(r._sum.monto ?? 0), 0);

    return resultado.map((r) => {
      const cat = categorias.find((c) => c.id === r.categoriaId)!;
      const monto = Number(r._sum.monto ?? 0);
      return {
        categoriaId: r.categoriaId,
        nombreCategoria: cat?.nombre ?? "Sin categoría",
        color: cat?.color ?? "#6b7280",
        icono: cat?.icono ?? "circle",
        monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0,
        cantidad: r._count,
      };
    });
  },
  ["desglose-categorias"],
  { revalidate: 30, tags: ["transacciones"] }
);

// Gráfico anual con cache más largo (cambia poco)
export const getCachedYearlyChart = unstable_cache(
  async (usuarioId: string, anio: number) => {
    const desde = new Date(anio, 0, 1);
    const hasta = new Date(anio, 11, 31, 23, 59, 59);

    const resultado = await prisma.$queryRaw<
      { mes: number; tipo: TipoTransaccion; total: number }[]
    >`
      SELECT 
        EXTRACT(MONTH FROM fecha)::int AS mes,
        tipo,
        SUM(monto)::float AS total
      FROM transacciones
      WHERE "usuario_id" = ${usuarioId}
        AND fecha >= ${desde}
        AND fecha <= ${hasta}
      GROUP BY mes, tipo
      ORDER BY mes
    `;

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const ingreso = resultado.find((r) => r.mes === m && r.tipo === TipoTransaccion.INGRESO)?.total ?? 0;
      const gastos = resultado.find((r) => r.mes === m && r.tipo === TipoTransaccion.GASTO)?.total ?? 0;
      return {
        mes: new Date(anio, i, 1).toLocaleString("es-AR", { month: "short" }),
        ingreso,
        gastos,
        ahorro: ingreso - gastos,
      };
    });
  },
  ["grafico-anual"],
  { revalidate: 60, tags: ["transacciones"] }
);