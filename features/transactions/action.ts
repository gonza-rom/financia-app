// src/features/transactions/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult, TransactionFormData } from "@/types";
import { TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createTransactionAction(
  data: TransactionFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();

    const transaction = await prisma.transaction.create({
      data: {
        amount: data.amount,
        description: data.description,
        type: data.type,
        date: data.date,
        categoryId: data.categoryId,
        isRecurring: data.isRecurring,
        notes: data.notes ?? null,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, data: { id: transaction.id } };
  } catch (err) {
    console.error("[createTransaction]", err);
    return { success: false, error: "Failed to create transaction." };
  }
}

export async function updateTransactionAction(
  id: string,
  data: Partial<TransactionFormData>
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    await prisma.transaction.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[updateTransaction]", err);
    return { success: false, error: "Failed to update transaction." };
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();

    await prisma.transaction.deleteMany({
      where: { id, userId: user.id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[deleteTransaction]", err);
    return { success: false, error: "Failed to delete transaction." };
  }
}

export type GetTransactionsParams = {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};