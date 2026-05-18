// app/empresas/page.tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCachedEmpresas } from "@/features/empresas/queries";
import { EmpresasList } from "@/features/empresas/empresas-list";
import { NuevaEmpresaButton } from "@/features/empresas/nueva-empresa-button";

export const metadata: Metadata = { title: "Empresas" };

export default async function EmpresasPage() {
  const usuario = await getCurrentUser();
  const empresas = await getCachedEmpresas(usuario.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tus negocios y proyectos</p>
        </div>
        <NuevaEmpresaButton />
      </div>
      <EmpresasList empresas={empresas} moneda={usuario.moneda} />
    </div>
  );
}