// src/app/transactions/loading.tsx
import { TransactionListSkeleton } from "@/components/skeletons";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="skeleton h-8 w-40 rounded-md" />
          <div className="skeleton h-4 w-56 rounded-md" />
        </div>
        <div className="skeleton h-8 w-36 rounded-md" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-8 w-48 rounded-md" />
        <div className="skeleton h-8 w-40 rounded-md" />
        <div className="skeleton h-8 w-32 rounded-md" />
      </div>
      <TransactionListSkeleton />
    </div>
  );
}