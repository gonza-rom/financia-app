// src/app/dashboard/loading.tsx
import { StatsSkeleton, ChartSkeleton, TransactionListSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="skeleton h-8 w-36 rounded-md" />
        <div className="skeleton h-4 w-56 rounded-md" />
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>
      <TransactionListSkeleton />
    </div>
  );
}