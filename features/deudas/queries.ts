// features/deudas/queries.ts
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { Deuda, ResumenDeudas, Moneda, PagoDeuda } from "@/types/deudas";
import type { EstadoDeuda } from "@prisma/client";

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapPago(raw: any): PagoDeuda {
  return {
    id: raw.id,
    monto: Number(raw.monto),
    fecha: raw.fecha.toISOString(),
    notas: raw.notas ?? undefined,
    creadoEn: raw.creadoEn.toISOString(),
  };
}

function mapDeuda(raw: any): Deuda {
  return {
    id: raw.id,
    tipo: raw.tipo.toLowerCase() as "cobrar" | "pagar",
    estado: raw.estado.toLowerCase() as "pendiente" | "pagada" | "vencida",
    contraparte: raw.contraparte,
    empresaId: raw.empresaId ?? undefined,
    descripcion: raw.descripcion ?? undefined,
    moneda: raw.moneda as Moneda,
    montoTotal: Number(raw.montoTotal),
    montoPagado: Number(raw.montoPagado ?? 0),
    fechaVencimiento: raw.fechaVencimiento?.toISOString(),
    fechaPago: raw.fechaPago?.toISOString(),
    cuotas: raw.cuotas?.map((c: any) => ({
        id: c.id,
        numero: c.numero,
        monto: Number(c.monto),
        fechaVencimiento: c.fechaVencimiento?.toISOString(),  // ← optional chaining
        fechaPago: c.fechaPago?.toISOString(),
        pagada: c.pagada,
    })) ?? [],
    pagos: raw.pagos?.map(mapPago) ?? [],
    creadaEn: raw.creadoEn.toISOString(),
    actualizadaEn: raw.actualizadoEn.toISOString(),
  };
}

// ─── Auto-marcar vencidas (fire-and-forget) ───────────────────────────────────

async function sincronizarVencidas(usuarioId: string) {
  const ahora = new Date();

  // Deudas sin cuotas → directo
  await prisma.deuda.updateMany({
    where: {
      usuarioId,
      estado: "PENDIENTE",
      fechaVencimiento: { lt: ahora },
      cuotas: { none: {} },
    },
    data: { estado: "VENCIDA" },
  });

  // Deudas con cuotas → buscar IDs donde alguna cuota sin pagar está vencida
  const idsVencidas = await prisma.deuda.findMany({
    where: {
      usuarioId,
      estado: "PENDIENTE",
      cuotas: {
        some: {
          pagada: false,
          fechaVencimiento: { lt: ahora },
        },
      },
    },
    select: { id: true },   // ← solo IDs, evita el N+1
  });

  if (idsVencidas.length > 0) {
    await prisma.deuda.updateMany({
      where: { id: { in: idsVencidas.map((d) => d.id) } },
      data: { estado: "VENCIDA" },
    });
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getDeudas(): Promise<Deuda[]> {
  const usuario = await getCurrentUser();

  sincronizarVencidas(usuario.id).catch(console.error);

  const rows = await prisma.deuda.findMany({
    where: { usuarioId: usuario.id },
    include: {
      cuotas: { orderBy: { numero: "asc" } },
      pagos: { orderBy: { fecha: "desc" } },
    },
    orderBy: { creadoEn: "desc" },
  });

  return rows.map(mapDeuda);
}

export async function getDeuda(id: string): Promise<Deuda | null> {
  const usuario = await getCurrentUser();

  const row = await prisma.deuda.findFirst({
    where: { id, usuarioId: usuario.id },
    include: {
      cuotas: { orderBy: { numero: "asc" } },
      pagos: { orderBy: { fecha: "desc" } },
    },
  });
  return row ? mapDeuda(row) : null;
}

export async function getResumenDeudas(moneda: Moneda = "ARS"): Promise<ResumenDeudas> {
  const usuario = await getCurrentUser();
  const usuarioId = usuario.id;
  const estadosActivos: EstadoDeuda[] = ["PENDIENTE", "VENCIDA"];

  const [cobrar, pagar, vencidas] = await Promise.all([
    // Deudas que te deben — incluye cuotas (sí las contamos)
    prisma.deuda.aggregate({
      where: {
        usuarioId,
        tipo: "COBRAR",
        estado: { in: estadosActivos },
      },
      _sum: { montoTotal: true, montoPagado: true },
    }),
    // Deudas que debés — SIN cuotas (las excluimos)
    prisma.deuda.aggregate({
      where: {
        usuarioId,
        tipo: "PAGAR",
        estado: { in: estadosActivos },
        cuotas: { none: {} },
      },
      _sum: { montoTotal: true, montoPagado: true },
    }),
    prisma.deuda.count({
      where: { usuarioId, estado: "VENCIDA", moneda },
    }),
  ]);

  return {
    totalCobrar: Number(cobrar._sum?.montoTotal ?? 0),
    totalPagar: Number(pagar._sum?.montoTotal ?? 0),
    moneda,
    vencidas,
  };
}