"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ResultadoAccion, FormularioTransaccion } from "@/types";
import { revalidatePath, revalidateTag } from "next/cache";

export async function createTransactionAction(
  data: FormularioTransaccion
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const transaccion = await prisma.$transaction(async (tx) => {
      const transaccion = await tx.transaccion.create({
        data: {
          monto: data.monto,
          descripcion: data.descripcion,
          tipo: data.tipo,
          fecha: data.fecha,
          categoriaId: data.categoriaId,
          esRecurrente: data.esRecurrente,
          notas: data.notas ?? null,
          usuarioId: usuario.id,
          cuentaId: data.cuentaId ?? null,
        },
      });

      if (data.cuentaId) {
        await tx.cuenta.update({
          where: { id: data.cuentaId },
          data: {
            saldo: {
              increment: data.tipo === "INGRESO" ? data.monto : -data.monto,
            },
          },
        });
      }

      return transaccion;
    });

    revalidateTag("transacciones");
    revalidateTag("dashboard-stats");
    revalidateTag("cuentas");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/cuentas");

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

    await prisma.$transaction(async (tx) => {
      // Buscar la transacción original para calcular diferencias
      const original = await tx.transaccion.findFirst({
        where: { id, usuarioId: usuario.id },
      });
      if (!original) return;

      // Revertir el efecto en la cuenta original si tenía una
      if (original.cuentaId) {
        await tx.cuenta.update({
          where: { id: original.cuentaId },
          data: {
            saldo: {
              increment: original.tipo === "INGRESO"
                ? -Number(original.monto)
                : Number(original.monto),
            },
          },
        });
      }

      // Actualizar la transacción
      await tx.transaccion.update({
        where: { id },
        data: {
          ...(data.monto       !== undefined && { monto: data.monto }),
          ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
          ...(data.tipo        !== undefined && { tipo: data.tipo }),
          ...(data.fecha       !== undefined && { fecha: data.fecha }),
          ...(data.categoriaId !== undefined && { categoriaId: data.categoriaId }),
          ...(data.notas       !== undefined && { notas: data.notas }),
          ...(data.cuentaId    !== undefined && { cuentaId: data.cuentaId ?? null }),
        },
      });

      // Aplicar el efecto en la cuenta nueva
      const nuevaCuentaId = data.cuentaId !== undefined ? (data.cuentaId ?? null) : original.cuentaId;
      const nuevoMonto    = data.monto !== undefined ? data.monto : Number(original.monto);
      const nuevoTipo     = data.tipo  !== undefined ? data.tipo  : original.tipo;

      if (nuevaCuentaId) {
        await tx.cuenta.update({
          where: { id: nuevaCuentaId },
          data: {
            saldo: {
              increment: nuevoTipo === "INGRESO" ? nuevoMonto : -nuevoMonto,
            },
          },
        });
      }
    });

    revalidateTag("transacciones");
    revalidateTag("dashboard-stats");
    revalidateTag("cuentas");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/cuentas");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarTransaccion]", err);
    return { success: false, error: "Error al actualizar la transacción." };
  }
}

export async function deleteTransactionAction(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
      const transaccion = await tx.transaccion.findFirst({
        where: { id, usuarioId: usuario.id },
      });
      if (!transaccion) return;

      await tx.transaccion.delete({ where: { id } });

      // Revertir el saldo si tenía cuenta asociada
      if (transaccion.cuentaId) {
        await tx.cuenta.update({
          where: { id: transaccion.cuentaId },
          data: {
            saldo: {
              increment: transaccion.tipo === "INGRESO"
                ? -Number(transaccion.monto)
                : Number(transaccion.monto),
            },
          },
        });
      }
    });

    revalidateTag("transacciones");
    revalidateTag("dashboard-stats");
    revalidateTag("cuentas");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/cuentas");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarTransaccion]", err);
    return { success: false, error: "Error al eliminar la transacción." };
  }
}