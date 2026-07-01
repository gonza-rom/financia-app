// features/estadisticas/queries.ts
import { prisma } from "@/lib/prisma";
import { TipoTransaccion } from "@prisma/client";
import { unstable_cache } from "next/cache";

export interface DatoDiarioDetallado {
  dia: number;
  label: string;
  ingreso: number;
  gasto: number;
  neto: number;
  acumuladoIngreso: number;
  acumuladoGasto: number;
  acumuladoNeto: number;
}

export interface CategoriaStats {
  categoriaId: string;
  nombre: string;
  color: string;
  icono: string;
  tipo: "INGRESO" | "GASTO";
  montoMes: number;
  montoTotal: number;
  porcentajeMes: number;
  cantidadMes: number;
  cantidadTotal: number;
  mesAnterior: number;
  cambio: number; // % vs mes anterior
}

export interface DatoMensualHistorico {
  mes: string;       // "ene", "feb"...
  anio: number;
  ingreso: number;
  gasto: number;
  neto: number;
}

export interface EstadisticasCompletas {
  diasMes: DatoDiarioDetallado[];
  categorias: CategoriaStats[];
  historico6Meses: DatoMensualHistorico[];
  totalesMes: { ingreso: number; gasto: number; neto: number };
  totalesAnio: { ingreso: number; gasto: number; neto: number };
}

export const getCachedEstadisticas = unstable_cache(
  async (usuarioId: string, anio: number, mes: number): Promise<EstadisticasCompletas> => {

    const desdeActual   = new Date(anio, mes - 1, 1);
    const hastaActual   = new Date(anio, mes, 0, 23, 59, 59);
    const desdeAnterior = new Date(anio, mes - 2, 1);
    const hastaAnterior = new Date(anio, mes - 1, 0, 23, 59, 59);
    const desdeAnio     = new Date(anio, 0, 1);
    const hastaAnio     = new Date(anio, 11, 31, 23, 59, 59);

    // ─── 1. Datos por día ─────────────────────────────────────────────────────
    const rowsDia = await prisma.$queryRaw<{ dia: number; tipo: string; total: number }[]>`
      SELECT
        EXTRACT(DAY FROM fecha)::int AS dia,
        tipo,
        SUM(monto)::float            AS total
      FROM transacciones
      WHERE usuario_id = ${usuarioId}
        AND fecha >= ${desdeActual}
        AND fecha <= ${hastaActual}
      GROUP BY dia, tipo
      ORDER BY dia
    `;

    const diasEnMes = new Date(anio, mes, 0).getDate();
    const hoyDia    = anio === new Date().getFullYear() && mes === new Date().getMonth() + 1
      ? new Date().getDate()
      : diasEnMes;

    let acumIng = 0, acumGas = 0;
    const diasMes: DatoDiarioDetallado[] = Array.from({ length: hoyDia }, (_, i) => {
      const dia = i + 1;
      const ing = rowsDia.find((r) => r.dia === dia && r.tipo === "INGRESO")?.total ?? 0;
      const gas = rowsDia.find((r) => r.dia === dia && r.tipo === "GASTO")?.total ?? 0;
      acumIng += ing;
      acumGas += gas;
      return {
        dia,
        label: String(dia),
        ingreso: ing,
        gasto: gas,
        neto: ing - gas,
        acumuladoIngreso: acumIng,
        acumuladoGasto: acumGas,
        acumuladoNeto: acumIng - acumGas,
      };
    });

    // ─── 2. Categorías mes actual ─────────────────────────────────────────────
    const [porCategoriaMes, porCategoriaAnterior, porCategoriaTotal] = await Promise.all([
      prisma.transaccion.groupBy({
        by: ["categoriaId", "tipo"],
        where: { usuarioId, fecha: { gte: desdeActual, lte: hastaActual } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.transaccion.groupBy({
        by: ["categoriaId"],
        where: { usuarioId, fecha: { gte: desdeAnterior, lte: hastaAnterior } },
        _sum: { monto: true },
      }),
      prisma.transaccion.groupBy({
        by: ["categoriaId"],
        where: { usuarioId },
        _sum: { monto: true },
        _count: true,
      }),
    ]);

    const categoriaIds = [...new Set(porCategoriaMes.map((r) => r.categoriaId))];
    const categoriasDb = await prisma.categoria.findMany({
      where: { id: { in: categoriaIds } },
    });

    const totalIngresosMes = porCategoriaMes
      .filter((r) => r.tipo === "INGRESO")
      .reduce((a, r) => a + Number(r._sum.monto ?? 0), 0);
    const totalGastosMes = porCategoriaMes
      .filter((r) => r.tipo === "GASTO")
      .reduce((a, r) => a + Number(r._sum.monto ?? 0), 0);

    const categorias: CategoriaStats[] = porCategoriaMes.map((r) => {
      const cat    = categoriasDb.find((c) => c.id === r.categoriaId);
      const mesAnt = Number(porCategoriaAnterior.find((p) => p.categoriaId === r.categoriaId)?._sum.monto ?? 0);
      const total  = Number(porCategoriaTotal.find((p) => p.categoriaId === r.categoriaId)?._sum.monto ?? 0);
      const totalCnt = porCategoriaTotal.find((p) => p.categoriaId === r.categoriaId)?._count ?? 0;
      const montoMes = Number(r._sum.monto ?? 0);
      const totalRef = r.tipo === "INGRESO" ? totalIngresosMes : totalGastosMes;

      return {
        categoriaId: r.categoriaId,
        nombre: cat?.nombre ?? "Sin categoría",
        color: cat?.color ?? "#6b7280",
        icono: cat?.icono ?? "circle",
        tipo: r.tipo as "INGRESO" | "GASTO",
        montoMes,
        montoTotal: total,
        porcentajeMes: totalRef > 0 ? (montoMes / totalRef) * 100 : 0,
        cantidadMes: r._count,
        cantidadTotal: totalCnt,
        mesAnterior: mesAnt,
        cambio: mesAnt > 0 ? ((montoMes - mesAnt) / mesAnt) * 100 : montoMes > 0 ? 100 : 0,
      };
    }).sort((a, b) => b.montoMes - a.montoMes);

    // ─── 3. Histórico últimos 6 meses ─────────────────────────────────────────
    const rowsHist = await prisma.$queryRaw<{ mes: number; anio: number; tipo: string; total: number }[]>`
      SELECT
        EXTRACT(MONTH FROM fecha)::int AS mes,
        EXTRACT(YEAR FROM fecha)::int  AS anio,
        tipo,
        SUM(monto)::float              AS total
      FROM transacciones
      WHERE usuario_id = ${usuarioId}
        AND fecha >= ${new Date(anio, mes - 7, 1)}
        AND fecha <= ${hastaActual}
      GROUP BY mes, anio, tipo
      ORDER BY anio, mes
    `;

    const historico6Meses: DatoMensualHistorico[] = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(anio, mes - 1 - (5 - i), 1);
      const m   = d.getMonth() + 1;
      const y   = d.getFullYear();
      const ing = rowsHist.find((r) => r.mes === m && r.anio === y && r.tipo === "INGRESO")?.total ?? 0;
      const gas = rowsHist.find((r) => r.mes === m && r.anio === y && r.tipo === "GASTO")?.total ?? 0;
      return {
        mes: d.toLocaleString("es-AR", { month: "short" }),
        anio: y,
        ingreso: ing,
        gasto: gas,
        neto: ing - gas,
      };
    });

    // ─── 4. Totales ───────────────────────────────────────────────────────────
    const [totMes, totAnio] = await Promise.all([
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId, fecha: { gte: desdeActual, lte: hastaActual } },
        _sum: { monto: true },
      }),
      prisma.transaccion.groupBy({
        by: ["tipo"],
        where: { usuarioId, fecha: { gte: desdeAnio, lte: hastaAnio } },
        _sum: { monto: true },
      }),
    ]);

    const g = (data: { tipo: TipoTransaccion; _sum: { monto: unknown } }[], t: TipoTransaccion) =>
      Number(data.find((r) => r.tipo === t)?._sum.monto ?? 0);

    const ingMes  = g(totMes as any, TipoTransaccion.INGRESO);
    const gasMes  = g(totMes as any, TipoTransaccion.GASTO);
    const ingAnio = g(totAnio as any, TipoTransaccion.INGRESO);
    const gasAnio = g(totAnio as any, TipoTransaccion.GASTO);

    return {
      diasMes,
      categorias,
      historico6Meses,
      totalesMes:  { ingreso: ingMes,  gasto: gasMes,  neto: ingMes  - gasMes  },
      totalesAnio: { ingreso: ingAnio, gasto: gasAnio, neto: ingAnio - gasAnio },
    };
  },
  ["estadisticas"],
  { revalidate: 120, tags: ["transacciones"] }
);