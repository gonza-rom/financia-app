// features/transactions/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ResultadoAccion, FormularioTransaccion } from "@/types";
import { revalidatePath } from "next/cache";

export async function createTransactionAction(
  data: FormularioTransaccion
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const transaccion = await prisma.transaccion.create({
      data: {
        monto: data.monto,
        descripcion: data.descripcion,
        tipo: data.tipo,
        fecha: data.fecha,
        categoriaId: data.categoriaId,
        esRecurrente: data.esRecurrente,
        notas: data.notas ?? null,
        usuarioId: usuario.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    return { success: true, data: { id: transaccion.id } };
  } catch (err) {
    console.error("[crearTransaccion]", err);
    return { success: false, error: "Error al crear la transacción." };
  }
}

export async function updateTransactionAction(
  id: string,
  data: Partial<FormularioTransaccion>
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.transaccion.updateMany({
      where: { id, usuarioId: usuario.id },
      data: {
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.fecha !== undefined && { fecha: data.fecha }),
        ...(data.categoriaId !== undefined && { categoriaId: data.categoriaId }),
        ...(data.notas !== undefined && { notas: data.notas }),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarTransaccion]", err);
    return { success: false, error: "Error al actualizar la transacción." };
  }
}

export async function deleteTransactionAction(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.transaccion.deleteMany({ where: { id, usuarioId: usuario.id } });

    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarTransaccion]", err);
    return { success: false, error: "Error al eliminar la transacción." };
  }
}