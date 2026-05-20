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

type ActualizarDeudaInput = {
  id: string;
  contraparte?: string;
  descripcion?: string | null;
  moneda?: Moneda;
  montoTotal?: number;
  fechaVencimiento?: Date | null;
  empresaId?: string;
};

export type ResultadoAccion<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generarCuotas(montoTotal: number, cantidad: number) {
  const montoPorCuota = Math.round((montoTotal / cantidad) * 100) / 100;
  const hoy = new Date();
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    monto: montoPorCuota,
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

// ─── Actualizar deuda ─────────────────────────────────────────────────────────

export async function actualizarDeuda(
  input: ActualizarDeudaInput
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.deuda.updateMany({
      where: { id: input.id, usuarioId: usuario.id },
      data: {
        ...(input.contraparte !== undefined && { contraparte: input.contraparte.trim() }),
        ...(input.descripcion !== undefined && { descripcion: input.descripcion?.trim() || null }),
        ...(input.moneda !== undefined && { moneda: input.moneda }),
        ...(input.montoTotal !== undefined && { montoTotal: input.montoTotal }),
        ...(input.fechaVencimiento !== undefined && { fechaVencimiento: input.fechaVencimiento }),
        ...(input.empresaId !== undefined && { empresaId: input.empresaId }),
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

    await prisma.deuda.updateMany({
      where: { id, usuarioId: usuario.id },
      data: { estado: "PAGADA", fechaPago: new Date() },
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

    await prisma.cuotaDeuda.update({
      where: { id: cuotaId },
      data: { pagada: true, fechaPago: new Date() },
    });

    // Si todas las demás cuotas ya estaban pagas, cerrar la deuda
    const todasPagas = deuda.cuotas
      .filter((c) => c.id !== cuotaId)
      .every((c) => c.pagada);

    if (todasPagas) {
      await prisma.deuda.update({
        where: { id: deudaId },
        data: { estado: "PAGADA", fechaPago: new Date() },
      });
    }

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