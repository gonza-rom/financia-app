// app/deudas/page.tsx
import { DeudaList } from "@/features/deudas/deuda-list";
import { DeudaHeader } from "@/features/deudas/deuda-header";
import { getDeudas } from "@/features/deudas/queries";

export const metadata = { title: "Deudas" };

export default async function DeudasPage() {
  const deudas = await getDeudas();

  const totalCobrar = deudas
    .filter((d) => d.tipo === "cobrar" && d.estado !== "pagada")
    .reduce((acc, d) => acc + d.montoTotal, 0);

  const totalPagar = deudas
    .filter((d) => d.tipo === "pagar" && d.estado !== "pagada")
    .reduce((acc, d) => acc + d.montoTotal, 0);

  const vencidas = deudas.filter((d) => d.estado === "vencida").length;

  return (
    <div className="space-y-6">
      <DeudaHeader
        totalCobrar={totalCobrar}
        totalPagar={totalPagar}
        vencidas={vencidas}
      />
      <DeudaList deudas={deudas} />
    </div>
  );
}