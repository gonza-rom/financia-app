// features/presupuestos/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

type Resultado<T = void> = { success: true; data: T } | { success: false; error: string };

// Un solo campo: la categoría y el monto mensual. monto <= 0 quita el presupuesto
// (no tiene sentido un tercer estado "presupuesto en cero" separado de "sin presupuesto").
export async function definirPresupuestoAction(
  categoriaId: string,
  monto: number
): Promise<Resultado> {
  try {
    const usuario = await getCurrentUser();

    const categoria = await prisma.categoria.findFirst({
      where: { id: categoriaId, usuarioId: usuario.id, tipo: "GASTO" },
    });
    if (!categoria) return { success: false, error: "Categoría no encontrada." };

    if (monto <= 0) {
      await prisma.presupuesto.deleteMany({ where: { categoriaId, usuarioId: usuario.id } });
    } else {
      await prisma.presupuesto.upsert({
        where: { categoriaId },
        create: { categoriaId, usuarioId: usuario.id, monto },
        update: { monto },
      });
    }

    revalidateTag("presupuestos");
    revalidateTag("categorias");
    revalidatePath("/categories");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[definirPresupuesto]", err);
    return { success: false, error: "Error al guardar el presupuesto." };
  }
}
