// features/empresas/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import type {
  FormularioEmpresa, FormularioCliente,
  FormularioProyecto, FormularioCobro, FormularioGastoEmpresa
} from "@/types/empresas";

type Resultado<T = void> = { success: true; data: T } | { success: false; error: string };

// ── Empresas ──────────────────────────────────────────────────────────────────

export async function crearEmpresaAction(data: FormularioEmpresa): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();
    const empresa = await prisma.empresa.create({
      data: { ...data, usuarioId: usuario.id },
    });
    revalidateTag("empresas");
    revalidatePath("/empresas");
    return { success: true, data: { id: empresa.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al crear la empresa." };
  }
}

export async function actualizarEmpresaAction(id: string, data: Partial<FormularioEmpresa>): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();
    await prisma.empresa.updateMany({ where: { id, usuarioId: usuario.id }, data });
    revalidateTag("empresas");
    revalidatePath("/empresas");
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al actualizar." };
  }
}

export async function eliminarEmpresaAction(id: string): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();
    await prisma.empresa.updateMany({
      where: { id, usuarioId: usuario.id },
      data: { activo: false },
    });
    revalidateTag("empresas");
    revalidatePath("/empresas");
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al eliminar." };
  }
}

// ── Clientes ──────────────────────────────────────────────────────────────────

export async function crearClienteAction(empresaId: string, data: FormularioCliente): Promise<Resultado<{ id: string }>> {
  try {
    await getCurrentUser();
    const cliente = await prisma.cliente.create({
      data: { ...data, empresaId },
    });
    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: { id: cliente.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al crear el cliente." };
  }
}

export async function eliminarClienteAction(id: string, empresaId: string): Promise<Resultado> {
  try {
    await getCurrentUser();
    await prisma.cliente.delete({ where: { id } });
    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al eliminar el cliente." };
  }
}

// ── Proyectos ─────────────────────────────────────────────────────────────────

export async function crearProyectoAction(empresaId: string, data: FormularioProyecto): Promise<Resultado<{ id: string }>> {
  try {
    await getCurrentUser();
    const proyecto = await prisma.proyecto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        tipoCobro: data.tipoCobro,
        montoTotal: data.montoTotal ?? null,
        clienteId: data.clienteId ?? null,
        fechaInicio: data.fechaInicio ?? null,
        fechaFin: data.fechaFin ?? null,
        empresaId,
      },
    });
    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: { id: proyecto.id } };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al crear el proyecto." };
  }
}

export async function actualizarEstadoProyectoAction(
  id: string, empresaId: string, estado: string
): Promise<Resultado> {
  try {
    await getCurrentUser();
    await prisma.proyecto.update({ where: { id }, data: { estado: estado as any } });
    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al actualizar el estado." };
  }
}

// ── Cobros ────────────────────────────────────────────────────────────────────

export async function crearCobroAction(proyectoId: string, empresaId: string, data: FormularioCobro): Promise<Resultado> {
  try {
    await getCurrentUser();
    await prisma.cobroProyecto.create({
      data: {
        descripcion: data.descripcion,
        monto: data.monto,
        fechaEstimada: data.fechaEstimada ?? null,
        proyectoId,
      },
    });
    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al crear el cobro." };
  }
}

export async function confirmarCobroAction(
  cobroId: string,
  empresaId: string,
  transferirAPersonal: boolean,
  categoriaId?: string
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();
    const cobro = await prisma.cobroProyecto.findUnique({
      where: { id: cobroId },
      include: { proyecto: { include: { empresa: true } } },
    });
    if (!cobro) return { success: false, error: "Cobro no encontrado." };

    let transaccionId: string | undefined;

    if (transferirAPersonal && categoriaId) {
      const tx = await prisma.transaccion.create({
        data: {
          monto: cobro.monto,
          descripcion: `${cobro.proyecto.nombre} — ${cobro.descripcion}`,
          tipo: "INGRESO",
          fecha: new Date(),
          categoriaId,
          esRecurrente: false,
          usuarioId: usuario.id,
        },
      });
      transaccionId = tx.id;
      revalidateTag("transacciones");
      revalidatePath("/dashboard");
      revalidatePath("/transactions");
    }

    await prisma.cobroProyecto.update({
      where: { id: cobroId },
      data: {
        estado: "COBRADO",
        fechaCobro: new Date(),
        ...(transaccionId && { transaccionId }),
      },
    });

    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al confirmar el cobro." };
  }
}

export async function eliminarCobroAction(id: string, empresaId: string): Promise<Resultado> {
  try {
    await getCurrentUser();
    await prisma.cobroProyecto.delete({ where: { id } });
    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al eliminar el cobro." };
  }
}

// ── Gastos empresa ─────────────────────────────────────────────────────────────

export async function crearGastoEmpresaAction(
  empresaId: string,
  data: FormularioGastoEmpresa,
  categoriaId?: string
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    let transaccionId: string | undefined;

    if (data.transferirAPersonal && categoriaId) {
      const tx = await prisma.transaccion.create({
        data: {
          monto: data.monto,
          descripcion: data.descripcion,
          tipo: "GASTO",
          fecha: data.fecha,
          categoriaId,
          esRecurrente: false,
          usuarioId: usuario.id,
        },
      });
      transaccionId = tx.id;
      revalidateTag("transacciones");
      revalidatePath("/dashboard");
    }

    await prisma.gastoEmpresa.create({
      data: {
        descripcion: data.descripcion,
        monto: data.monto,
        fecha: data.fecha,
        notas: data.notas ?? null,
        empresaId,
        ...(transaccionId && { transaccionId }),
      },
    });

    revalidateTag("empresas");
    revalidatePath(`/empresas/${empresaId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Error al registrar el gasto." };
  }
}