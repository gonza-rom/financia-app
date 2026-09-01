// features/deudas/actions.ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Moneda } from "@/types/deudas";
import { generarCuotas } from "./cuotas";
import { validarCuenta, ajustarSaldoCuenta, revertirSaldoCuenta } from "@/lib/cuentas";

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
  categoriaId?: string; // ← nuevo
  cuentaId?: string;
  fechaInicioCuotas?: Date | null;
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

// ─── Crear deuda ──────────────────────────────────────────────────────────────

export async function crearDeuda(
  input: CrearDeudaInput
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    if (input.empresaId) {
      const empresa = await prisma.empresa.findFirst({ where: { id: input.empresaId, usuarioId: usuario.id } });
      if (!empresa) return { success: false, error: "Empresa no encontrada." };
    }
    if (input.categoriaId) {
      const categoria = await prisma.categoria.findFirst({ where: { id: input.categoriaId, usuarioId: usuario.id } });
      if (!categoria) return { success: false, error: "Categoría no encontrada." };
    }
    if (input.cuentaId && !(await validarCuenta(usuario.id, input.cuentaId))) {
      return { success: false, error: "Cuenta no encontrada." };
    }

    const cuotas =
      input.tieneCuotas && input.cantidadCuotas && input.cantidadCuotas >= 2
        ? generarCuotas(input.montoTotal, input.cantidadCuotas, input.fechaInicioCuotas ?? new Date())
        : undefined;

    const deuda = await prisma.$transaction(async (tx) => {
      const deuda = await tx.deuda.create({
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

      // Solo crear transacción si tiene categoría Y no tiene cuotas
      if (input.categoriaId && !input.tieneCuotas) {
        const descripcion = input.tipo === "COBRAR"
          ? `Préstamo a ${input.contraparte.trim()}`
          : `Deuda con ${input.contraparte.trim()}`;
        const tipoTx = input.tipo === "COBRAR" ? "GASTO" : "INGRESO";

        await tx.transaccion.create({
          data: {
            monto: input.montoTotal,
            descripcion,
            tipo: tipoTx,
            fecha: new Date(),
            esRecurrente: false,
            usuarioId: usuario.id,
            categoriaId: input.categoriaId,
            cuentaId: input.cuentaId ?? null,
          },
        });
        if (input.cuentaId) {
          await ajustarSaldoCuenta(tx, input.cuentaId, tipoTx, input.montoTotal);
        }
      }

      return deuda;
    });

    revalidatePath("/deudas");
    revalidatePath("/transacciones");
    revalidatePath("/dashboard");
    if (input.categoriaId && !input.tieneCuotas && input.cuentaId) {
      revalidateTag("cuentas");
      revalidatePath("/cuentas");
    }
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
  notas?: string,
  categoriaId?: string,   // ← nuevo parámetro
  cuentaId?: string,
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
    });

    if (!deuda) return { success: false, error: "Deuda no encontrada." };
    if (deuda.estado === "PAGADA") return { success: false, error: "La deuda ya está pagada." };
    if (monto <= 0) return { success: false, error: "El monto debe ser mayor a cero." };

    if (categoriaId) {
      const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, usuarioId: usuario.id } });
      if (!categoria) return { success: false, error: "Categoría no encontrada." };
    }
    if (cuentaId && !(await validarCuenta(usuario.id, cuentaId))) {
      return { success: false, error: "Cuenta no encontrada." };
    }

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

    const tipoTx = deuda.tipo === "COBRAR" ? "INGRESO" : "GASTO";

    await prisma.$transaction(async (tx) => {
      // Crear transacción si se pasó categoría
      let transaccionId: string | undefined;
      if (categoriaId) {
        const descripcion = deuda.tipo === "COBRAR"
          ? `Cobro de deuda — ${deuda.contraparte}`
          : `Pago de deuda — ${deuda.contraparte}`;

        const transaccion = await tx.transaccion.create({
          data: {
            monto,
            descripcion,
            tipo: tipoTx,
            fecha: new Date(),
            notas: notas?.trim() || null,
            esRecurrente: false,
            usuarioId: usuario.id,
            categoriaId,
            cuentaId: cuentaId ?? null,
          },
        });
        transaccionId = transaccion.id;
        if (cuentaId) {
          await ajustarSaldoCuenta(tx, cuentaId, tipoTx, monto);
        }
      }

      await tx.pagoDeuda.create({
        data: {
          deudaId,
          monto,
          notas: notas?.trim() || null,
          fecha: new Date(),
          ...(transaccionId && { transaccionId }),
        },
      });
      await tx.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          ...(pagadaCompleta && { estado: "PAGADA", fechaPago: new Date() }),
        },
      });
    });

    revalidatePath("/deudas");
    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    if (categoriaId && cuentaId) {
      revalidateTag("cuentas");
      revalidatePath("/cuentas");
    }
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

    let cuentaTocada = false;

    await prisma.$transaction(async (tx) => {
      // Si ese pago había generado una transacción personal, se borra también —
      // si no, quedaría un ingreso/gasto fantasma que en realidad nunca pasó.
      if (pago.transaccionId) {
        const transaccion = await tx.transaccion.findUnique({ where: { id: pago.transaccionId } });
        if (transaccion?.cuentaId) {
          await revertirSaldoCuenta(tx, transaccion.cuentaId, transaccion.tipo, Number(transaccion.monto));
          cuentaTocada = true;
        }
      }

      await tx.pagoDeuda.delete({ where: { id: pagoId } });
      await tx.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          // Si estaba pagada y revertimos un pago, vuelve a pendiente
          ...(deuda.estado === "PAGADA" && { estado: "PENDIENTE", fechaPago: null }),
        },
      });
      if (pago.transaccionId) {
        await tx.transaccion.deleteMany({ where: { id: pago.transaccionId, usuarioId: usuario.id } });
      }
    });

    revalidatePath("/deudas");
    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    if (cuentaTocada) {
      revalidateTag("cuentas");
      revalidatePath("/cuentas");
    }
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

    if (input.empresaId !== undefined) {
      const empresa = await prisma.empresa.findFirst({ where: { id: input.empresaId, usuarioId: usuario.id } });
      if (!empresa) return { success: false, error: "Empresa no encontrada." };
    }

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

export async function marcarDeudaPagada(
  id: string,
  categoriaId?: string,   // ← nuevo parámetro
  cuentaId?: string,
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({ where: { id, usuarioId: usuario.id } });
    if (!deuda) return { success: false, error: "Deuda no encontrada." };

    if (categoriaId) {
      const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, usuarioId: usuario.id } });
      if (!categoria) return { success: false, error: "Categoría no encontrada." };
    }
    if (cuentaId && !(await validarCuenta(usuario.id, cuentaId))) {
      return { success: false, error: "Cuenta no encontrada." };
    }

    const montoRestante = toNumber(deuda.montoTotal) - toNumber(deuda.montoPagado);
    const tipoTx = deuda.tipo === "COBRAR" ? "INGRESO" : "GASTO";
    let cuentaTocada = false;

    await prisma.$transaction(async (tx) => {
      // Crear transacción por el monto restante si se pasó categoría
      let transaccionId: string | undefined;
      if (categoriaId && montoRestante > 0) {
        const descripcion = deuda.tipo === "COBRAR"
          ? `Cobro de deuda — ${deuda.contraparte}`
          : `Pago de deuda — ${deuda.contraparte}`;

        const transaccion = await tx.transaccion.create({
          data: {
            monto: montoRestante,
            descripcion,
            tipo: tipoTx,
            fecha: new Date(),
            esRecurrente: false,
            usuarioId: usuario.id,
            categoriaId,
            cuentaId: cuentaId ?? null,
          },
        });
        transaccionId = transaccion.id;
        if (cuentaId) {
          await ajustarSaldoCuenta(tx, cuentaId, tipoTx, montoRestante);
          cuentaTocada = true;
        }
      }

      // Si hay monto restante, crear también el PagoDeuda
      if (montoRestante > 0) {
        await tx.pagoDeuda.create({
          data: {
            deudaId: id,
            monto: montoRestante,
            fecha: new Date(),
            notas: "Saldado completo",
            ...(transaccionId && { transaccionId }),
          },
        });
      }
      await tx.deuda.update({
        where: { id },
        data: {
          estado: "PAGADA",
          fechaPago: new Date(),
          montoPagado: deuda.montoTotal,
        },
      });
    });

    revalidatePath("/deudas");
    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    if (cuentaTocada) {
      revalidateTag("cuentas");
      revalidatePath("/cuentas");
    }
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
  deudaId: string,
  categoriaId?: string,  // ← agregar
  cuentaId?: string,
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
      include: { cuotas: true },
    });
    if (!deuda) return { success: false, error: "Deuda no encontrada." };

    if (categoriaId) {
      const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, usuarioId: usuario.id } });
      if (!categoria) return { success: false, error: "Categoría no encontrada." };
    }
    if (cuentaId && !(await validarCuenta(usuario.id, cuentaId))) {
      return { success: false, error: "Cuenta no encontrada." };
    }

    const cuota = deuda.cuotas.find((c) => c.id === cuotaId);
    if (!cuota || cuota.pagada) return { success: false, error: "Cuota no válida." };

    const todasPagas = deuda.cuotas
      .filter((c) => c.id !== cuotaId)
      .every((c) => c.pagada);

    const nuevoMontoPagado = toNumber(deuda.montoPagado) + toNumber(cuota.monto);
    const tipoTx = deuda.tipo === "COBRAR" ? "INGRESO" : "GASTO";
    let cuentaTocada = false;

    await prisma.$transaction(async (tx) => {
      let transaccionId: string | undefined;
      if (categoriaId) {
        const transaccion = await tx.transaccion.create({
          data: {
            monto: toNumber(cuota.monto),
            descripcion: deuda.tipo === "COBRAR"
              ? `Cuota ${cuota.numero} cobrada — ${deuda.contraparte}`
              : `Cuota ${cuota.numero} pagada — ${deuda.contraparte}`,
            tipo: tipoTx,
            fecha: new Date(),
            esRecurrente: false,
            usuarioId: usuario.id,
            categoriaId,
            cuentaId: cuentaId ?? null,
          },
        });
        transaccionId = transaccion.id;
        if (cuentaId) {
          await ajustarSaldoCuenta(tx, cuentaId, tipoTx, toNumber(cuota.monto));
          cuentaTocada = true;
        }
      }

      await tx.cuotaDeuda.update({
        where: { id: cuotaId },
        data: { pagada: true, fechaPago: new Date(), ...(transaccionId && { transaccionId }) },
      });
      await tx.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          ...(todasPagas && { estado: "PAGADA", fechaPago: new Date() }),
        },
      });
    });

    revalidatePath("/deudas");
    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    if (cuentaTocada) {
      revalidateTag("cuentas");
      revalidatePath("/cuentas");
    }
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[marcarCuotaPagada]", error);
    return { success: false, error: "No se pudo marcar la cuota como pagada." };
  }
}

// ─── Deshacer cuota pagada (ej. se marcó por error) ───────────────────────────

export async function desmarcarCuotaPagada(
  cuotaId: string,
  deudaId: string,
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    const deuda = await prisma.deuda.findFirst({
      where: { id: deudaId, usuarioId: usuario.id },
      include: { cuotas: true },
    });
    if (!deuda) return { success: false, error: "Deuda no encontrada." };

    const cuota = deuda.cuotas.find((c) => c.id === cuotaId);
    if (!cuota || !cuota.pagada) return { success: false, error: "Cuota no válida." };

    const nuevoMontoPagado = Math.max(0, toNumber(deuda.montoPagado) - toNumber(cuota.monto));
    let cuentaTocada = false;

    await prisma.$transaction(async (tx) => {
      // Si esa cuota había generado una transacción personal, se borra también —
      // si no, quedaría un ingreso/gasto fantasma que en realidad nunca pasó.
      if (cuota.transaccionId) {
        const transaccion = await tx.transaccion.findUnique({ where: { id: cuota.transaccionId } });
        if (transaccion?.cuentaId) {
          await revertirSaldoCuenta(tx, transaccion.cuentaId, transaccion.tipo, Number(transaccion.monto));
          cuentaTocada = true;
        }
      }

      await tx.cuotaDeuda.update({
        where: { id: cuotaId },
        data: { pagada: false, fechaPago: null, transaccionId: null },
      });
      await tx.deuda.update({
        where: { id: deudaId },
        data: {
          montoPagado: nuevoMontoPagado,
          // Si estaba marcada pagada por completar todas las cuotas, vuelve a pendiente.
          ...(deuda.estado === "PAGADA" && { estado: "PENDIENTE", fechaPago: null }),
        },
      });
      if (cuota.transaccionId) {
        await tx.transaccion.deleteMany({ where: { id: cuota.transaccionId, usuarioId: usuario.id } });
      }
    });

    revalidatePath("/deudas");
    revalidatePath("/dashboard");
    revalidatePath("/transacciones");
    if (cuentaTocada) {
      revalidateTag("cuentas");
      revalidatePath("/cuentas");
    }
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[desmarcarCuotaPagada]", error);
    return { success: false, error: "No se pudo deshacer la cuota." };
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
