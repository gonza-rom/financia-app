// src/components/skeletons/index.tsx

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton size-8 rounded-md" />
          </div>
          <div className="skeleton h-7 w-32 rounded-md" />
          <div className="skeleton h-3 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="space-y-1">
        <div className="skeleton h-4 w-28 rounded-md" />
        <div className="skeleton h-3 w-44 rounded-md" />
      </div>
      <div className="skeleton h-[240px] w-full rounded-lg" />
    </div>
  );
}

export function TransactionListSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="skeleton h-4 w-36 rounded-md" />
        <div className="skeleton h-3 w-16 rounded-md" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <div className="skeleton size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-40 rounded-md" />
              <div className="skeleton h-3 w-24 rounded-md" />
            </div>
            <div className="skeleton h-4 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, si) => (
        <div key={si}>
          <div className="skeleton h-5 w-20 rounded-md mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="skeleton size-9 rounded-full" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-24 rounded-md" />
                  <div className="skeleton h-3 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-1">
      <div className="skeleton h-8 w-40 rounded-md" />
      <div className="skeleton h-4 w-56 rounded-md" />
    </div>
  );
}