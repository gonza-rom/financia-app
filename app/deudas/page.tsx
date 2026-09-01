// app/deudas/page.tsx
import { DeudaList } from "@/features/deudas/deuda-list";
import { DeudaHeader } from "@/features/deudas/deuda-header";
import { getDeudas } from "@/features/deudas/queries";
import { getCategorias } from "@/features/categories/queries";
import { getCuentas } from "@/features/cuentas/queries";
import { getCurrentUser } from "@/lib/auth";
import { getProximoCierre } from "@/lib/utils";

export const metadata = { title: "Deudas" };

export default async function DeudasPage() {
  const usuario = await getCurrentUser();

  const [deudas, categorias, cuentas] = await Promise.all([
    getDeudas(),
    getCategorias(usuario.id),
    getCuentas(usuario.id),
  ]);

  const activas = deudas.filter((d) => d.estado !== "pagada");

  const totalCobrar = activas
    .filter((d) => d.tipo === "cobrar")
    .reduce((acc, d) => acc + (d.montoTotal - (d.montoPagado ?? 0)), 0);

  const totalPagar = activas
    .filter((d) => d.tipo === "pagar" && !d.cuotas?.length)
    .reduce((acc, d) => acc + (d.montoTotal - (d.montoPagado ?? 0)), 0);

  const totalCuotasCobrar = activas
    .filter((d) => d.tipo === "cobrar" && d.cuotas?.length)
    .reduce((acc, d) => acc + (d.montoTotal - (d.montoPagado ?? 0)), 0);

  const totalCuotasPagar = activas
    .filter((d) => d.tipo === "pagar" && d.cuotas?.length)
    .reduce((acc, d) => acc + (d.montoTotal - (d.montoPagado ?? 0)), 0);

  const vencidas = deudas.filter((d) => d.estado === "vencida").length;

  // Cuánto hay que pagar antes del próximo cierre de tarjeta (no del mes calendario) —
  // solo deudas que debés vos, no las que te deben a vos.
  const fechaCierre = getProximoCierre(usuario.diaCierreTarjeta);
  const cuotasHastaCierre = activas
    .filter((d) => d.tipo === "pagar" && d.cuotas?.length)
    .reduce((acc, d) => {
      const cuotasPendientes = d.cuotas?.filter((c) => {
        if (c.pagada) return false;
        return new Date(c.fechaVencimiento) <= fechaCierre;
      }) ?? [];
      return acc + cuotasPendientes.reduce((s, c) => s + c.monto, 0);
    }, 0);

  return (
    <div className="space-y-6">
      <DeudaHeader
        totalCobrar={totalCobrar}
        totalPagar={totalPagar}
        totalCuotasCobrar={totalCuotasCobrar}
        totalCuotasPagar={totalCuotasPagar}
        cuotasHastaCierre={cuotasHastaCierre}
        fechaCierre={fechaCierre}
        vencidas={vencidas}
      />
      <DeudaList deudas={deudas} categorias={categorias} cuentas={cuentas} />
    </div>
  );
}