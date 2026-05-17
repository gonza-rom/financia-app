// src/app/categories/loading.tsx
import { CategoryGridSkeleton } from "@/components/skeletons";

export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="skeleton h-8 w-36 rounded-md" />
          <div className="skeleton h-4 w-48 rounded-md" />
        </div>
        <div className="skeleton h-8 w-36 rounded-md" />
      </div>
      <CategoryGridSkeleton />
    </div>
  );
}