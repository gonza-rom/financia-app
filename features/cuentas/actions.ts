"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FormularioCuenta, FormularioTransferencia } from "@/types/cuentas";
import { revalidatePath, revalidateTag } from "next/cache"; // ← agregar revalidateTag

type Resultado<T = void> = { success: true; data: T } | { success: false; error: string };

export async function crearCuentaAction(
  data: FormularioCuenta
): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const cuenta = await prisma.cuenta.create({
      data: {
        nombre: data.nombre.trim(),
        tipo: data.tipo,
        saldo: data.saldo,
        color: data.color,
        icono: data.icono,
        usuarioId: usuario.id,
      },
    });

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: { id: cuenta.id } };
  } catch (err) {
    console.error("[crearCuenta]", err);
    return { success: false, error: "Error al crear la cuenta." };
  }
}

export async function actualizarCuentaAction(
  id: string,
  data: Partial<FormularioCuenta>
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    await prisma.cuenta.updateMany({
      where: { id, usuarioId: usuario.id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
        ...(data.tipo   !== undefined && { tipo: data.tipo }),
        ...(data.color  !== undefined && { color: data.color }),
        ...(data.icono  !== undefined && { icono: data.icono }),
      },
    });

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarCuenta]", err);
    return { success: false, error: "Error al actualizar la cuenta." };
  }
}

export async function ajustarSaldoCuentaAction(
  id: string,
  nuevoSaldo: number
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    const cuenta = await prisma.cuenta.findFirst({
      where: { id, usuarioId: usuario.id },
    });
    if (!cuenta) return { success: false, error: "Cuenta no encontrada." };

    await prisma.cuenta.update({
      where: { id },
      data: { saldo: nuevoSaldo },
    });

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[ajustarSaldoCuenta]", err);
    return { success: false, error: "Error al ajustar el saldo." };
  }
}

export async function eliminarCuentaAction(id: string): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    const [countTx, countTransf] = await Promise.all([
      prisma.transaccion.count({ where: { cuentaId: id, usuarioId: usuario.id } }),
      prisma.transferencia.count({
        where: { usuarioId: usuario.id, OR: [{ cuentaOrigenId: id }, { cuentaDestinoId: id }] },
      }),
    ]);

    if (countTx > 0 || countTransf > 0) {
      await prisma.cuenta.updateMany({
        where: { id, usuarioId: usuario.id },
        data: { activo: false },
      });
    } else {
      await prisma.cuenta.deleteMany({ where: { id, usuarioId: usuario.id } });
    }

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarCuenta]", err);
    return { success: false, error: "Error al eliminar la cuenta." };
  }
}

export async function transferirEntreCuentasAction(
  data: FormularioTransferencia
): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();
    const { cuentaOrigenId, cuentaDestinoId, monto, fecha, descripcion } = data;

    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };
    if (cuentaOrigenId === cuentaDestinoId) {
      return { success: false, error: "Elegí cuentas distintas." };
    }

    const [origen, destino] = await Promise.all([
      prisma.cuenta.findFirst({ where: { id: cuentaOrigenId, usuarioId: usuario.id } }),
      prisma.cuenta.findFirst({ where: { id: cuentaDestinoId, usuarioId: usuario.id } }),
    ]);

    if (!origen || !destino) return { success: false, error: "Cuenta no encontrada." };

    // Débito atómico y condicionado al saldo disponible (evita perder plata con transferencias concurrentes)
    let transferenciaId: string;
    try {
      transferenciaId = await prisma.$transaction(async (tx) => {
        const debito = await tx.cuenta.updateMany({
          where: { id: cuentaOrigenId, usuarioId: usuario.id, saldo: { gte: monto } },
          data: { saldo: { decrement: monto } },
        });
        if (debito.count === 0) {
          throw new Error("SALDO_INSUFICIENTE");
        }
        await tx.cuenta.updateMany({
          where: { id: cuentaDestinoId, usuarioId: usuario.id },
          data: { saldo: { increment: monto } },
        });
        const transferencia = await tx.transferencia.create({
          data: {
            monto,
            fecha,
            descripcion: descripcion?.trim() || null,
            usuarioId: usuario.id,
            cuentaOrigenId,
            cuentaDestinoId,
          },
        });
        return transferencia.id;
      });
    } catch (err) {
      if (err instanceof Error && err.message === "SALDO_INSUFICIENTE") {
        return { success: false, error: "Saldo insuficiente en la cuenta de origen." };
      }
      throw err;
    }

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: { id: transferenciaId } };
  } catch (err) {
    console.error("[transferirEntreCuentas]", err);
    return { success: false, error: "Error al transferir." };
  }
}

export async function eliminarTransferenciaAction(id: string): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    const transferencia = await prisma.transferencia.findFirst({
      where: { id, usuarioId: usuario.id },
    });
    if (!transferencia) return { success: false, error: "Transferencia no encontrada." };

    const monto = Number(transferencia.monto);

    await prisma.$transaction([
      prisma.transferencia.delete({ where: { id } }),
      // Revertir: la plata vuelve a origen, sale de destino
      prisma.cuenta.updateMany({
        where: { id: transferencia.cuentaOrigenId, usuarioId: usuario.id },
        data: { saldo: { increment: monto } },
      }),
      prisma.cuenta.updateMany({
        where: { id: transferencia.cuentaDestinoId, usuarioId: usuario.id },
        data: { saldo: { decrement: monto } },
      }),
    ]);

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarTransferencia]", err);
    return { success: false, error: "Error al eliminar la transferencia." };
  }
}

// Solo permite editar fecha/descripción — el monto y las cuentas quedan fijos una
// vez creada (si te equivocaste en eso, es más seguro eliminar y volver a cargarla
// que reversar saldos de una cuenta a otra a mano).
export async function actualizarTransferenciaAction(
  id: string,
  data: { fecha?: Date; descripcion?: string }
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    await prisma.transferencia.updateMany({
      where: { id, usuarioId: usuario.id },
      data: {
        ...(data.fecha !== undefined && { fecha: data.fecha }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion.trim() || null }),
      },
    });

    revalidatePath("/cuentas");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarTransferencia]", err);
    return { success: false, error: "Error al actualizar la transferencia." };
  }
}