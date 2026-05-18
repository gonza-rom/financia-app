// features/deudas/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Moneda } from "@/types/deudas";

// ─── Types ────────────────────────────────────────────────────────────────────

type CuotaInput = {
  numero: number;
  monto: number;
  fechaVencimiento: string;
};

type CrearDeudaInput = {
  tipo: "COBRAR" | "PAGAR";
  contraparte: string;
  descripcion?: string;
  moneda: Moneda;
  montoTotal: number;
  fechaVencimiento?: string;
  empresaId?: string;
  cuotas?: CuotaInput[];
};

type ActualizarDeudaInput = Partial<Omit<CrearDeudaInput, "tipo">> & {
  id: string;
};

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Crear deuda ──────────────────────────────────────────────────────────────

export async function crearDeuda(input: CrearDeudaInput): Promise<ActionResult<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.create({
      data: {
        tipo: input.tipo,
        contraparte: input.contraparte,
        descripcion: input.descripcion,
        moneda: input.moneda,
        montoTotal: input.montoTotal,
        fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : undefined,
        usuarioId: usuario.id,
        empresaId: input.empresaId,
        cuotas: input.cuotas?.length
          ? { create: input.cuotas.map((c) => ({ ...c, fechaVencimiento: new Date(c.fechaVencimiento) })) }
          : undefined,
      },
    });

    revalidatePath("/deudas");
    return { ok: true, data: { id: deuda.id } };
  } catch (error) {
    console.error("[crearDeuda]", error);
    return { ok: false, error: "No se pudo crear la deuda" };
  }
}

// ─── Actualizar deuda ─────────────────────────────────────────────────────────

export async function actualizarDeuda(input: ActualizarDeudaInput): Promise<ActionResult> {
  try {
    const usuario = await getCurrentUser();

    await prisma.deuda.updateMany({
      where: { id: input.id, usuarioId: usuario.id },  // ownership en el where, sin findFirst extra
      data: {
        contraparte: input.contraparte,
        descripcion: input.descripcion,
        moneda: input.moneda,
        montoTotal: input.montoTotal,
        fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : undefined,
        empresaId: input.empresaId,
      },
    });

    revalidatePath("/deudas");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[actualizarDeuda]", error);
    return { ok: false, error: "No se pudo actualizar la deuda" };
  }
}

// ─── Marcar deuda como pagada ─────────────────────────────────────────────────

export async function marcarDeudaPagada(id: string): Promise<ActionResult> {
  try {
    const usuario = await getCurrentUser();

    await prisma.deuda.updateMany({
      where: { id, usuarioId: usuario.id },
      data: { estado: "PAGADA", fechaPago: new Date() },
    });

    revalidatePath("/deudas");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[marcarDeudaPagada]", error);
    return { ok: false, error: "No se pudo marcar como pagada" };
  }
}

// ─── Marcar cuota como pagada ─────────────────────────────────────────────────

export async function marcarCuotaPagada(cuotaId: string, deudaId: string): Promise<ActionResult> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
      include: { cuotas: true },
    });
    if (!deuda) return { ok: false, error: "Deuda no encontrada" };

    await prisma.cuotaDeuda.update({
      where: { id: cuotaId },
      data: { pagada: true, fechaPago: new Date() },
    });

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
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[marcarCuotaPagada]", error);
    return { ok: false, error: "No se pudo marcar la cuota como pagada" };
  }
}

// ─── Eliminar deuda ───────────────────────────────────────────────────────────

export async function eliminarDeuda(id: string): Promise<ActionResult> {
  try {
    const usuario = await getCurrentUser();

    await prisma.deuda.deleteMany({ where: { id, usuarioId: usuario.id } });

    revalidatePath("/deudas");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[eliminarDeuda]", error);
    return { ok: false, error: "No se pudo eliminar la deuda" };
  }
}