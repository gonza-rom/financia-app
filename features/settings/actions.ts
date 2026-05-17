// features/settings/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ResultadoAccion } from "@/types";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: {
  nombre: string;
  moneda: string;
}): Promise<ResultadoAccion> {
  try {
    const usuario = await getCurrentUser();

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nombre: data.nombre || null,
        moneda: data.moneda,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[actualizarPerfil]", err);
    return { success: false, error: "Error al actualizar el perfil." };
  }
}