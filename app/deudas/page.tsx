// app/deudas/page.tsx
import { DeudaList } from "@/features/deudas/deuda-list";
import { DeudaHeader } from "@/features/deudas/deuda-header";
import { getDeudas } from "@/features/deudas/queries";
import { getCategorias } from "@/features/categories/queries";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Deudas" };

export default async function DeudasPage() {
  const usuario = await getCurrentUser();

  const [deudas, categorias] = await Promise.all([
    getDeudas(),
    getCategorias(usuario.id),
  ]);

  const activas = deudas.filter((d) => d.estado !== "pagada");

  const totalCobrar = activas
    .filter((d) => d.tipo === "cobrar")
    .reduce((acc, d) => acc + (d.montoTotal - (d.montoPagado ?? 0)), 0);

  const totalPagar = activas
    .filter((d) => d.tipo === "pagar")
    .reduce((acc, d) => acc + (d.montoTotal - (d.montoPagado ?? 0)), 0);

  const vencidas = deudas.filter((d) => d.estado === "vencida").length;

  return (
    <div className="space-y-6">
      <DeudaHeader
        totalCobrar={totalCobrar}
        totalPagar={totalPagar}
        vencidas={vencidas}
      />
      <DeudaList deudas={deudas} categorias={categorias} />
    </div>
  );
}