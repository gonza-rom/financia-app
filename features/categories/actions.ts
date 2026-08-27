// features/categories/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ResultadoAccion, FormularioCategoria } from "@/types";
import type { TipoTransaccion } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";

// Valida que, si se pasó un parentId, sea una categoría del mismo usuario,
// del mismo tipo (no se puede mezclar Ingreso/Gasto) y que sea de nivel
// superior (una subcategoría no puede tener a su vez subcategorías).
async function validarParent(
  parentId: string | null | undefined,
  usuarioId: string,
  tipo: TipoTransaccion,
  propioId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!parentId) return { ok: true };
  if (parentId === propioId) return { ok: false, error: "Una categoría no puede ser su propia categoría padre." };

  const parent = await prisma.categoria.findFirst({ where: { id: parentId, usuarioId } });
  if (!parent) return { ok: false, error: "Categoría padre no encontrada." };
  if (parent.parentId) return { ok: false, error: "No se pueden anidar subcategorías dentro de otra subcategoría." };
  if (parent.tipo !== tipo) return { ok: false, error: "La categoría padre debe ser del mismo tipo (ingreso/gasto)." };

  return { ok: true };
}

export async function createCategoryAction(data: FormularioCategoria): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();
    if (!data.nombre?.trim()) return { success: false, error: "El nombre es requerido." };

    const validacion = await validarParent(data.parentId, usuario.id, data.tipo);
    if (!validacion.ok) return { success: false, error: validacion.error };

    await prisma.categoria.create({
      data: {
        nombre: data.nombre.trim(),
        icono: data.icono ?? "circle",
        color: data.color ?? "#6b7280",
        tipo: data.tipo,
        usuarioId: usuario.id,
        parentId: data.parentId || null,
      },
    });

    revalidateTag("categorias");
    revalidatePath("/categories");
    revalidatePath("/transactions");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[crearCategoria]", err);
    return { success: false, error: "Error al crear la categoría." };
  }
}

export async function updateCategoryAction(
  id: string,
  data: Partial<FormularioCategoria>
): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    if (data.parentId !== undefined) {
      const actual = await prisma.categoria.findFirst({
        where: { id, usuarioId: usuario.id },
        include: { _count: { select: { subcategorias: true } } },
      });
      if (!actual) return { success: false, error: "Categoría no encontrada." };
      if (data.parentId && actual._count.subcategorias > 0) {
        return { success: false, error: "Esta categoría ya tiene subcategorías propias, no puede pasar a ser subcategoría de otra." };
      }

      const validacion = await validarParent(data.parentId, usuario.id, data.tipo ?? actual.tipo, id);
      if (!validacion.ok) return { success: false, error: validacion.error };
    }

    await prisma.categoria.updateMany({
      where: { id, usuarioId: usuario.id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icono !== undefined && { icono: data.icono }),
        ...(data.parentId !== undefined && { parentId: data.parentId || null }),
      },
    });

    revalidateTag("categorias");
    revalidatePath("/categories");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarCategoria]", err);
    return { success: false, error: "Error al actualizar la categoría." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    // Si tiene subcategorías, al borrarla quedan huérfanas (pasan a nivel superior) — no es
    // destructivo, pero avisamos antes para que no sea una sorpresa.
    const conSubcategorias = await prisma.categoria.count({ where: { parentId: id, usuarioId: usuario.id } });
    if (conSubcategorias > 0) {
      return {
        success: false,
        error: `Esta categoría tiene ${conSubcategorias} subcategoría${conSubcategorias !== 1 ? "s" : ""}. Movelas o eliminalas primero.`,
      };
    }

    await prisma.categoria.deleteMany({ where: { id, usuarioId: usuario.id } });

    revalidateTag("categorias");
    revalidatePath("/categories");
    revalidatePath("/transactions");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[eliminarCategoria]", err);
    return { success: false, error: "Error al eliminar la categoría." };
  }
}
