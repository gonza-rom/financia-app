// features/categories/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ResultadoAccion, FormularioCategoria } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(data: FormularioCategoria): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();
    if (!data.nombre?.trim()) return { success: false, error: "El nombre es requerido." };

    await prisma.categoria.create({
      data: {
        nombre: data.nombre.trim(),
        icono: data.icono ?? "circle",
        color: data.color ?? "#6b7280",
        tipo: data.tipo,
        usuarioId: usuario.id,
      },
    });

    revalidatePath("/categorias");
    revalidatePath("/transacciones");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[crearCategoria]", err);
    return { success: false, error: "Error al crear la categoría." };
  }
}

export async function updateCategoryAction(id: string, data: Partial<FormularioCategoria>): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.categoria.updateMany({
      where: { id, usuarioId: usuario.id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icono !== undefined && { icono: data.icono }),
      },
    });

    revalidatePath("/categorias");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarCategoria]", err);
    return { success: false, error: "Error al actualizar la categoría." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.categoria.deleteMany({ where: { id, usuarioId: usuario.id } });

    revalidatePath("/categorias");
    revalidatePath("/transacciones");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarCategoria]", err);
    return { success: false, error: "Error al eliminar la categoría." };
  }
}