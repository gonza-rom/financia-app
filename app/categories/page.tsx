// app/categories/page.tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCategoriesWithStats } from "@/features/categories/queries";
import { CategoryGrid } from "@/features/categories/category-grid";
import { AddCategoryButton } from "@/features/categories/add-category-button";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const usuario = await getCurrentUser();
  const categorias = await getCategoriesWithStats(usuario.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organizá tus transacciones
          </p>
        </div>
        <AddCategoryButton />
      </div>
      <CategoryGrid categories={categorias} moneda={usuario.moneda} />
    </div>
  );
}