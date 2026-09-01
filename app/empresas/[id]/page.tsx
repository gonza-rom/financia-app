// app/empresas/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmpresaDetalle } from "@/features/empresas/queries";
import { getCategorias } from "@/features/categories/queries";
import { getCuentas } from "@/features/cuentas/queries";
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
  const [empresa, categorias, cuentas] = await Promise.all([
    getEmpresaDetalle(id, usuario.id),
    getCategorias(usuario.id),
    getCuentas(usuario.id),
  ]);

  if (!empresa) notFound();

  return <EmpresaDetallePage empresa={empresa} moneda={usuario.moneda} categorias={categorias} cuentas={cuentas} />;
}