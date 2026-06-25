// app/transactions/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getTransacciones } from "@/features/transactions/queries";
import { getCategorias } from "@/features/categories/queries";
import { getCuentas } from "@/features/cuentas/queries";
import { TransactionList } from "@/features/transactions/transaction-list";
import { TransactionFiltersBar } from "@/features/transactions/transaction-filters";
import { AddTransactionButton } from "@/features/transactions/add-transaction-button";
import { TransactionListSkeleton } from "@/components/skeletons";
import { TipoTransaccion } from "@prisma/client";

export const metadata: Metadata = { title: "Transacciones" };

interface PageProps {
  searchParams: Promise<{
    pagina?: string;
    tipo?: string;
    categoriaId?: string;
    busqueda?: string;
  }>;
}

async function TransaccionesData({
  usuarioId,
  moneda,
  searchParams,
}: {
  usuarioId: string;
  moneda: string;
  searchParams: Awaited<PageProps["searchParams"]>;
}) {
  const pagina = Number(searchParams.pagina ?? "1");
  const tipo = searchParams.tipo as TipoTransaccion | undefined;

  const [{ data: transacciones, total, totalPaginas }, categorias, cuentas] = await Promise.all([
    getTransacciones(usuarioId, {
      pagina,
      limite: 20,
      tipo,
      categoriaId: searchParams.categoriaId,
      busqueda: searchParams.busqueda,
    }),
    getCategorias(usuarioId),
    getCuentas(usuarioId),
  ]);

  return (
    <TransactionList
      transacciones={transacciones}
      categorias={categorias}
      cuentas={cuentas}
      moneda={moneda}
      total={total}
      pagina={pagina}
      totalPaginas={totalPaginas}
    />
  );
}

export default async function TransaccionesPage({ searchParams }: PageProps) {
  const [usuario, params] = await Promise.all([getCurrentUser(), searchParams]);

  const [categorias, cuentas] = await Promise.all([
    getCategorias(usuario.id),
    getCuentas(usuario.id),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transacciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Tus ingresos y gastos</p>
        </div>
        <AddTransactionButton categorias={categorias} cuentas={cuentas} />
      </div>

      <TransactionFiltersBar categorias={categorias} />

      <Suspense key={JSON.stringify(params)} fallback={<TransactionListSkeleton />}>
        <TransaccionesData usuarioId={usuario.id} moneda={usuario.moneda} searchParams={params} />
      </Suspense>
    </div>
  );
}