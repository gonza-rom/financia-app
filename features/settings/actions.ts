// src/features/settings/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: {
  name: string;
  currency: string;
}): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name || null,
        currency: data.currency,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateProfile]", err);
    return { success: false, error: "Failed to update profile." };
  }
}