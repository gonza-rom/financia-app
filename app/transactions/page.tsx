// app/transactions/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getTransactions } from "@/features/transactions/queries";
import { getCachedCategories } from "@/features/categories/queries";
import { TransactionList } from "@/features/transactions/transaction-list";
import { TransactionFiltersBar } from "@/features/transactions/transaction-filters";
import { AddTransactionButton } from "@/features/transactions/add-transaction-button";
import { TransactionListSkeleton } from "@/components/skeletons";
import { TransactionType } from "@prisma/client";

export const metadata: Metadata = { title: "Transactions" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    categoryId?: string;
    search?: string;
  }>;
}

async function TransactionsData({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: Awaited<PageProps["searchParams"]>;
}) {
  const page = Number(searchParams.page ?? "1");
  const type = searchParams.type as TransactionType | undefined;

  const [{ data: transactions, total, totalPages }, categories] = await Promise.all([
    getTransactions(userId, {
      page,
      limit: 20,
      type,
      categoryId: searchParams.categoryId,
      search: searchParams.search,
    }),
    getCachedCategories(userId),
  ]);

  return (
    <TransactionList
      transactions={transactions}
      categories={categories}
      total={total}
      page={page}
      totalPages={totalPages}
    />
  );
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const categories = await getCachedCategories(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your income and expenses
          </p>
        </div>
        <AddTransactionButton categories={categories} />
      </div>

      <TransactionFiltersBar categories={categories} />

      <Suspense key={JSON.stringify(params)} fallback={<TransactionListSkeleton />}>
        <TransactionsData userId={user.id} searchParams={params} />
      </Suspense>
    </div>
  );
}