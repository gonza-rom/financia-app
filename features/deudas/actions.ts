// features/deudas/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Moneda } from "@/types/deudas";

// ─── Types ────────────────────────────────────────────────────────────────────

type CrearDeudaInput = {
  tipo: "COBRAR" | "PAGAR";
  contraparte: string;
  descripcion?: string | null;
  moneda: Moneda;
  montoTotal: number;
  fechaVencimiento?: Date | null;
  empresaId?: string;
  tieneCuotas: boolean;
  cantidadCuotas?: number | null;
};

export type ResultadoAccion<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function generarCuotas(montoTotal: number, cantidad: number) {
  const monto = Math.round((montoTotal / cantidad) * 100) / 100;
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    monto,
    fechaVencimiento: new Date(hoy.getFullYear(), hoy.getMonth() + i + 1, hoy.getDate()),
  }));
}

// ─── Crear deuda ──────────────────────────────────────────────────────────────

export async function crearDeuda(
  input: CrearDeudaInput
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const cuotas =
      input.tieneCuotas && input.cantidadCuotas && input.cantidadCuotas >= 2
        ? generarCuotas(input.montoTotal, input.cantidadCuotas)
        : undefined;

    const deuda = await prisma.deuda.create({
      data: {
        tipo: input.tipo,
        contraparte: input.contraparte.trim(),
        descripcion: input.descripcion?.trim() || null,
        moneda: input.moneda,
        montoTotal: input.montoTotal,
        montoPagado: 0,
        fechaVencimiento: input.fechaVencimiento ?? null,
        usuarioId: usuario.id,
        empresaId: input.empresaId,
        cuotas: cuotas ? { create: cuotas } : undefined,
      },
    });

    revalidatePath("/deudas");
    return { success: true, data: { id: deuda.id } };
  } catch (error) {
    console.error("[crearDeuda]", error);
    return { success: false, error: "No se pudo crear la deuda." };
  }
}

// ─── Registrar pago parcial ───────────────────────────────────────────────────

export async function registrarPagoDeuda(
  deudaId: string,
  monto: number,
  notas?: string
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
    });

    if (!deuda) return { success: false, error: "Deuda no encontrada." };
    if (deuda.estado === "PAGADA") return { success: false, error: "La deuda ya está pagada." };
    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };

    // Convertir Decimal → number de forma segura
    const montoTotalNum  = toNumber(deuda.montoTotal);
    const montoPagadoNum = toNumber(deuda.montoPagado);
    const saldoPendiente = montoTotalNum - montoPagadoNum;

    if (monto > saldoPendiente + 0.01) {
      return {
        success: false,
        error: `El monto supera el saldo pendiente de ${saldoPendiente.toLocaleString("es-AR")}.`,
      };
    }

    const nuevoMontoPagado = montoPagadoNum + monto;
    const pagadaCompleta   = nuevoMontoPagado >= montoTotalNum - 0.01;

    await prisma.$transaction([
      prisma.pagoDeuda.create({
        data: {
          deudaId,
          monto,
          notas: notas?.trim() || null,
          fecha: new Date(),
        },
      }),
      prisma.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          ...(pagadaCompleta && { estado: "PAGADA", fechaPago: new Date() }),
        },
      }),
    ]);

    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[registrarPagoDeuda]", error);
    return { success: false, error: "No se pudo registrar el pago." };
  }
}

// ─── Eliminar pago parcial ────────────────────────────────────────────────────

export async function eliminarPagoDeuda(
  pagoId: string,
  deudaId: string
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
    });
    if (!deuda) return { success: false, error: "Deuda no encontrada." };

    const pago = await prisma.pagoDeuda.findFirst({ where: { id: pagoId, deudaId } });
    if (!pago) return { success: false, error: "Pago no encontrado." };

    const montoPagadoNum  = toNumber(deuda.montoPagado);
    const montoPagoNum    = toNumber(pago.monto);
    const nuevoMontoPagado = Math.max(0, montoPagadoNum - montoPagoNum);

    await prisma.$transaction([
      prisma.pagoDeuda.delete({ where: { id: pagoId } }),
      prisma.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          // Si estaba pagada y revertimos un pago, vuelve a pendiente
          ...(deuda.estado === "PAGADA" && { estado: "PENDIENTE", fechaPago: null }),
        },
      }),
    ]);

    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[eliminarPagoDeuda]", error);
    return { success: false, error: "No se pudo eliminar el pago." };
  }
}

// ─── Actualizar deuda ─────────────────────────────────────────────────────────

export async function actualizarDeuda(input: {
  id: string;
  contraparte?: string;
  descripcion?: string | null;
  moneda?: Moneda;
  montoTotal?: number;
  fechaVencimiento?: Date | null;
  empresaId?: string;
}): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.deuda.updateMany({
      where: { id: input.id, usuarioId: usuario.id },
      data: {
        ...(input.contraparte !== undefined && { contraparte: input.contraparte.trim() }),
        ...(input.descripcion !== undefined && { descripcion: input.descripcion?.trim() || null }),
        ...(input.moneda      !== undefined && { moneda: input.moneda }),
        ...(input.montoTotal  !== undefined && { montoTotal: input.montoTotal }),
        ...(input.fechaVencimiento !== undefined && { fechaVencimiento: input.fechaVencimiento }),
        ...(input.empresaId   !== undefined && { empresaId: input.empresaId }),
      },
    });

    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[actualizarDeuda]", error);
    return { success: false, error: "No se pudo actualizar la deuda." };
  }
}

// ─── Marcar deuda como pagada ─────────────────────────────────────────────────

export async function marcarDeudaPagada(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({ where: { id, usuarioId: usuario.id } });
    if (!deuda) return { success: false, error: "Deuda no encontrada." };

    await prisma.deuda.update({
      where: { id },
      data: {
        estado: "PAGADA",
        fechaPago: new Date(),
        montoPagado: deuda.montoTotal, // saldar completamente
      },
    });

    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[marcarDeudaPagada]", error);
    return { success: false, error: "No se pudo marcar como pagada." };
  }
}

// ─── Marcar deuda como vencida ────────────────────────────────────────────────

export async function marcarDeudaVencida(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.deuda.updateMany({
      where: { id, usuarioId: usuario.id, estado: "PENDIENTE" },
      data: { estado: "VENCIDA" },
    });

    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[marcarDeudaVencida]", error);
    return { success: false, error: "No se pudo marcar como vencida." };
  }
}

// ─── Marcar cuota como pagada ─────────────────────────────────────────────────

export async function marcarCuotaPagada(
  cuotaId: string,
  deudaId: string
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
      include: { cuotas: true },
    });
    if (!deuda) return { success: false, error: "Deuda no encontrada." };

    const cuota = deuda.cuotas.find((c) => c.id === cuotaId);
    if (!cuota || cuota.pagada) return { success: false, error: "Cuota no válida." };

    const todasPagas = deuda.cuotas
      .filter((c) => c.id !== cuotaId)
      .every((c) => c.pagada);

    const nuevoMontoPagado = toNumber(deuda.montoPagado) + toNumber(cuota.monto);

    await prisma.$transaction([
      prisma.cuotaDeuda.update({
        where: { id: cuotaId },
        data: { pagada: true, fechaPago: new Date() },
      }),
      prisma.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          ...(todasPagas && { estado: "PAGADA", fechaPago: new Date() }),
        },
      }),
    ]);

    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[marcarCuotaPagada]", error);
    return { success: false, error: "No se pudo marcar la cuota como pagada." };
  }
}

// ─── Eliminar deuda ───────────────────────────────────────────────────────────

export async function eliminarDeuda(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();
    await prisma.deuda.deleteMany({ where: { id, usuarioId: usuario.id } });
    revalidatePath("/deudas");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[eliminarDeuda]", error);
    return { success: false, error: "No se pudo eliminar la deuda." };
  }
}