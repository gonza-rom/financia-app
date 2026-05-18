// app/empresas/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmpresaDetalle } from "@/features/empresas/queries";
import { getCategorias } from "@/features/categories/queries";
import { EmpresaDetallePage } from "@/features/empresas/empresa-detalle";

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const usuario = await getCurrentUser();
  const empresa = await getEmpresaDetalle(id, usuario.id);
  return { title: empresa?.nombre ?? "Empresa" };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const usuario = await getCurrentUser();
  const [empresa, categorias] = await Promise.all([
    getEmpresaDetalle(id, usuario.id),
    getCategorias(usuario.id),
  ]);

  if (!empresa) notFound();

  return <EmpresaDetallePage empresa={empresa} moneda={usuario.moneda} categorias={categorias} />;
}