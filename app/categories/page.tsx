// app/categories/page.tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCategoriesWithStats } from "@/features/categories/queries";
import { CategoryGrid } from "@/features/categories/category-grid";
import { AddCategoryButton } from "@/features/categories/add-category-button";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  const categories = await getCategoriesWithStats(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize your transactions
          </p>
        </div>
        <AddCategoryButton />
      </div>
      <CategoryGrid categories={categories} />
    </div>
  );
}