// app/cuentas/page.tsx
import { getCurrentUser } from "@/lib/auth";
import { getCachedCuentas, getCachedSaldoTotalCuentas } from "@/features/cuentas/queries";
import { CuentaCard } from "@/features/cuentas/cuenta-card";
import { NuevaCuentaDialog } from "@/features/cuentas/nueva-cuenta-dialog";
import { NuevaCuentaButton } from "@/features/cuentas/nueva-cuenta-button";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

export const metadata = { title: "Cuentas" };

export default async function CuentasPage() {
  const usuario = await getCurrentUser();
  const moneda = usuario.moneda ?? "ARS";

  const [cuentas, saldoTotal] = await Promise.all([
    getCachedCuentas(usuario.id),
    getCachedSaldoTotalCuentas(usuario.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administrá tus cuentas y saldos
          </p>
        </div>
        <NuevaCuentaButton />
      </div>

      {/* Saldo total */}
      <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Wallet className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Saldo total en todas las cuentas</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {formatCurrency(saldoTotal, moneda)}
          </p>
        </div>
      </div>

      {/* Lista de cuentas */}
      {cuentas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Wallet className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No tenés cuentas todavía</p>
          <p className="text-xs text-muted-foreground mt-1">
            Agregá tu primera cuenta para empezar a trackear tus saldos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuentas.map((cuenta) => (
            <CuentaCard key={cuenta.id} cuenta={cuenta} moneda={moneda} />
          ))}
        </div>
      )}
    </div>
  );
}