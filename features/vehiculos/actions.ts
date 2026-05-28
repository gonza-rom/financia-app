// features/vehiculos/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import type { FormularioVehiculo, FormularioSeccion, FormularioGastoVehiculo } from "@/types/vehiculos";
import { SECCIONES_PREDEFINIDAS } from "@/types/vehiculos";

type Resultado<T = void> = { success: true; data: T } | { success: false; error: string };

// ─── Vehículos ────────────────────────────────────────────────────────────────

export async function crearVehiculoAction(
  data: FormularioVehiculo,
  conSeccionesPredefinidas = true
): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const vehiculo = await prisma.vehiculo.create({
      data: {
        nombre: data.nombre.trim(),
        marca: data.marca.trim(),
        modelo: data.modelo.trim(),
        anio: data.anio,
        patente: data.patente?.trim() || null,
        color: data.color,
        kilometraje: data.kilometraje ?? 0,
        usuarioId: usuario.id,
        // Crear secciones predefinidas si se solicita
        secciones: conSeccionesPredefinidas ? {
          create: SECCIONES_PREDEFINIDAS.map((s, i) => ({
            nombre: s.nombre,
            icono: s.icono,
            color: s.color,
            orden: i,
          })),
        } : undefined,
      },
    });

    revalidateTag("vehiculos");
    revalidatePath("/vehiculos");
    return { success: true, data: { id: vehiculo.id } };
  } catch (err) {
    console.error("[crearVehiculo]", err);
    return { success: false, error: "Error al crear el vehículo." };
  }
}

export async function actualizarVehiculoAction(
  id: string,
  data: Partial<FormularioVehiculo>
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    await prisma.vehiculo.updateMany({
      where: { id, usuarioId: usuario.id },
      data: {
        ...(data.nombre && { nombre: data.nombre.trim() }),
        ...(data.marca && { marca: data.marca.trim() }),
        ...(data.modelo && { modelo: data.modelo.trim() }),
        ...(data.anio && { anio: data.anio }),
        ...(data.patente !== undefined && { patente: data.patente?.trim() || null }),
        ...(data.color && { color: data.color }),
        ...(data.kilometraje !== undefined && { kilometraje: data.kilometraje }),
      },
    });

    revalidateTag("vehiculos");
    revalidatePath("/vehiculos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarVehiculo]", err);
    return { success: false, error: "Error al actualizar el vehículo." };
  }
}

export async function eliminarVehiculoAction(id: string): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    // Soft delete
    await prisma.vehiculo.updateMany({
      where: { id, usuarioId: usuario.id },
      data: { activo: false },
    });

    revalidateTag("vehiculos");
    revalidatePath("/vehiculos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarVehiculo]", err);
    return { success: false, error: "Error al eliminar el vehículo." };
  }
}

// ─── Secciones ────────────────────────────────────────────────────────────────

export async function crearSeccionAction(
  vehiculoId: string,
  data: FormularioSeccion
): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    // Verificar que el vehículo pertenece al usuario
    const vehiculo = await prisma.vehiculo.findFirst({
      where: { id: vehiculoId, usuarioId: usuario.id },
      include: { _count: { select: { secciones: true } } },
    });
    if (!vehiculo) return { success: false, error: "Vehículo no encontrado." };

    const seccion = await prisma.seccionVehiculo.create({
      data: {
        nombre: data.nombre.trim(),
        icono: data.icono,
        color: data.color,
        orden: vehiculo._count.secciones,
        vehiculoId,
      },
    });

    revalidateTag("vehiculos");
    revalidatePath(`/vehiculos/${vehiculoId}`);
    return { success: true, data: { id: seccion.id } };
  } catch (err) {
    console.error("[crearSeccion]", err);
    return { success: false, error: "Error al crear la sección." };
  }
}

export async function actualizarSeccionAction(
  id: string,
  data: Partial<FormularioSeccion>
): Promise<Resultado> {
  try {
    await getCurrentUser();

    await prisma.seccionVehiculo.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre.trim() }),
        ...(data.icono && { icono: data.icono }),
        ...(data.color && { color: data.color }),
      },
    });

    revalidateTag("vehiculos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarSeccion]", err);
    return { success: false, error: "Error al actualizar la sección." };
  }
}

export async function eliminarSeccionAction(id: string): Promise<Resultado> {
  try {
    await getCurrentUser();

    await prisma.seccionVehiculo.delete({ where: { id } });

    revalidateTag("vehiculos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarSeccion]", err);
    return { success: false, error: "Error al eliminar la sección. Asegurate de que no tenga gastos." };
  }
}

// ─── Gastos ───────────────────────────────────────────────────────────────────

export async function crearGastoVehiculoAction(
  vehiculoId: string,
  seccionId: string,
  data: FormularioGastoVehiculo & {
    registrarEnFinanzas?: boolean;
    categoriaId?: string;
  }
): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await getCurrentUser();

    const vehiculo = await prisma.vehiculo.findFirst({
      where: { id: vehiculoId, usuarioId: usuario.id },
    });
    if (!vehiculo) return { success: false, error: "Vehículo no encontrado." };

    if (data.registrarEnFinanzas && !data.categoriaId) {
      return { success: false, error: "Seleccioná una categoría para registrar en finanzas." };
    }

    // Crear transacción personal si se solicita
    let transaccionId: string | undefined;

    if (data.registrarEnFinanzas && data.categoriaId) {
      const transaccion = await prisma.transaccion.create({
        data: {
          monto: data.monto,
          descripcion: data.descripcion.trim(), // misma descripción
          tipo: "GASTO",
          fecha: data.fecha,
          notas: data.notas?.trim() || null,
          esRecurrente: false,
          usuarioId: usuario.id,
          categoriaId: data.categoriaId,
        },
      });
      transaccionId = transaccion.id;
    }

    // Crear el gasto del vehículo vinculado a la transacción
    const gasto = await prisma.gastoVehiculo.create({
      data: {
        monto: data.monto,
        fecha: data.fecha,
        descripcion: data.descripcion.trim(),
        notas: data.notas?.trim() || null,
        kilometraje: data.kilometraje ?? null,
        litros: data.litros ?? null,
        precioPorUnidad: data.precioPorUnidad ?? null,
        vencimiento: data.vencimiento ?? null,
        proximoKm: data.proximoKm ?? null,
        vehiculoId,
        seccionId,
        ...(transaccionId && { transaccionId }),
      },
    });

    // Actualizar km del vehículo si el nuevo es mayor
    if (data.kilometraje && data.kilometraje > (vehiculo.kilometraje ?? 0)) {
      await prisma.vehiculo.update({
        where: { id: vehiculoId },
        data: { kilometraje: data.kilometraje },
      });
    }

    revalidateTag("vehiculos");
    revalidatePath(`/vehiculos/${vehiculoId}`);
    revalidatePath("/dashboard");
    revalidatePath("/transacciones");

    return { success: true, data: { id: gasto.id } };
  } catch (err) {
    console.error("[crearGastoVehiculo]", err);
    return { success: false, error: "Error al registrar el gasto." };
  }
}

export async function actualizarGastoVehiculoAction(
  id: string,
  data: Partial<FormularioGastoVehiculo>
): Promise<Resultado> {
  try {
    await getCurrentUser();

    await prisma.gastoVehiculo.update({
      where: { id },
      data: {
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.fecha !== undefined && { fecha: data.fecha }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion.trim() }),
        ...(data.notas !== undefined && { notas: data.notas?.trim() || null }),
        ...(data.kilometraje !== undefined && { kilometraje: data.kilometraje }),
        ...(data.litros !== undefined && { litros: data.litros }),
        ...(data.precioPorUnidad !== undefined && { precioPorUnidad: data.precioPorUnidad }),
        ...(data.vencimiento !== undefined && { vencimiento: data.vencimiento }),
        ...(data.proximoKm !== undefined && { proximoKm: data.proximoKm }),
      },
    });

    revalidateTag("vehiculos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarGastoVehiculo]", err);
    return { success: false, error: "Error al actualizar el gasto." };
  }
}

export async function eliminarGastoVehiculoAction(id: string): Promise<Resultado> {
  try {
    await getCurrentUser();
    await prisma.gastoVehiculo.delete({ where: { id } });
    revalidateTag("vehiculos");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarGastoVehiculo]", err);
    return { success: false, error: "Error al eliminar el gasto." };
  }
}