// src/features/categories/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult, CategoryFormData } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(
  data: CategoryFormData
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    if (!data.name?.trim()) {
      return { success: false, error: "Name is required." };
    }

    await prisma.category.create({
      data: {
        name: data.name.trim(),
        icon: data.icon ?? "circle",
        color: data.color ?? "#6b7280",
        type: data.type,
        userId: user.id,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[createCategory]", err);
    return { success: false, error: "Failed to create category." };
  }
}

export async function updateCategoryAction(
  id: string,
  data: Partial<CategoryFormData>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    await prisma.category.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
    });

    revalidatePath("/categories");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateCategory]", err);
    return { success: false, error: "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    await prisma.category.deleteMany({
      where: { id, userId: user.id },
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteCategory]", err);
    return { success: false, error: "Failed to delete category." };
  }
}