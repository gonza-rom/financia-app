"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FormularioCuenta } from "@/types/cuentas";
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

    const count = await prisma.transaccion.count({
      where: { cuentaId: id, usuarioId: usuario.id },
    });

    if (count > 0) {
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
  cuentaOrigenId: string,
  cuentaDestinoId: string,
  monto: number
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };
    if (cuentaOrigenId === cuentaDestinoId) {
      return { success: false, error: "Elegí cuentas distintas." };
    }

    const [origen, destino] = await Promise.all([
      prisma.cuenta.findFirst({ where: { id: cuentaOrigenId, usuarioId: usuario.id } }),
      prisma.cuenta.findFirst({ where: { id: cuentaDestinoId, usuarioId: usuario.id } }),
    ]);

    if (!origen || !destino) return { success: false, error: "Cuenta no encontrada." };

    const saldoOrigen = Number(origen.saldo);
    if (monto > saldoOrigen) {
      return { success: false, error: "Saldo insuficiente en la cuenta de origen." };
    }

    await prisma.$transaction([
      prisma.cuenta.update({
        where: { id: cuentaOrigenId },
        data: { saldo: saldoOrigen - monto },
      }),
      prisma.cuenta.update({
        where: { id: cuentaDestinoId },
        data: { saldo: Number(destino.saldo) + monto },
      }),
    ]);

    revalidateTag("cuentas");
    revalidatePath("/cuentas");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[transferirEntreCuentas]", err);
    return { success: false, error: "Error al transferir." };
  }
}