// features/dashboard/recordatorios-query.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export interface Recordatorio {
  tipo: "seguro" | "service" | "deuda";
  titulo: string;
  subtitulo: string;
  vencido: boolean;
  href: string;
}

const VENTANA_DIAS = 14; // avisar con hasta 2 semanas de anticipación
const VENTANA_KM = 500; // avisar cuando falten hasta 500km para el próximo service

function formatFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(fecha);
}

// Recordatorios de vencimientos: seguro de vehículo, próximo service (por km) y
// deudas/cuotas por vencer. Todo dentro de la ventana de anticipación, ordenado
// con lo ya vencido primero.
export const getCachedRecordatorios = unstable_cache(
  async (usuarioId: string): Promise<Recordatorio[]> => {
    const ahora = new Date();
    const limiteFecha = new Date(ahora.getTime() + VENTANA_DIAS * 24 * 60 * 60 * 1000);

    type Item = { titulo: string; subtitulo: string; vencido: boolean; href: string; orden: number; tipo: Recordatorio["tipo"] };
    const items: Item[] = [];

    // ─── Vehículos: seguro y próximo service ──────────────────────────────────
    const vehiculos = await prisma.vehiculo.findMany({
      where: { usuarioId, activo: true },
      select: {
        id: true,
        nombre: true,
        kilometraje: true,
        gastos: {
          where: { OR: [{ vencimiento: { not: null } }, { proximoKm: { not: null } }] },
          orderBy: { fecha: "desc" },
          select: { vencimiento: true, proximoKm: true },
        },
      },
    });

    for (const v of vehiculos) {
      const conVencimiento = v.gastos.find((g) => g.vencimiento);
      if (conVencimiento?.vencimiento && conVencimiento.vencimiento <= limiteFecha) {
        const vencido = conVencimiento.vencimiento < ahora;
        items.push({
          tipo: "seguro",
          titulo: `Seguro de ${v.nombre}`,
          subtitulo: `${vencido ? "Venció" : "Vence"} el ${formatFecha(conVencimiento.vencimiento)}`,
          vencido,
          href: `/vehiculos/${v.id}`,
          orden: conVencimiento.vencimiento.getTime(),
        });
      }

      const conProximoKm = v.gastos.find((g) => g.proximoKm != null);
      if (conProximoKm?.proximoKm != null && v.kilometraje != null) {
        const faltan = conProximoKm.proximoKm - v.kilometraje;
        if (faltan <= VENTANA_KM) {
          const vencido = faltan <= 0;
          items.push({
            tipo: "service",
            titulo: `Service de ${v.nombre}`,
            subtitulo: vencido
              ? `Ya pasaste el km previsto (${conProximoKm.proximoKm.toLocaleString("es-AR")})`
              : `Faltan ${faltan.toLocaleString("es-AR")} km`,
            vencido,
            href: `/vehiculos/${v.id}`,
            orden: vencido ? 0 : ahora.getTime() + faltan, // sin fecha real — ordena junto a lo próximo
          });
        }
      }
    }

    // ─── Deudas sin cuotas por vencer ──────────────────────────────────────────
    const deudas = await prisma.deuda.findMany({
      where: {
        usuarioId,
        estado: { in: ["PENDIENTE", "VENCIDA"] },
        cuotas: { none: {} },
        fechaVencimiento: { not: null, lte: limiteFecha },
      },
      select: { contraparte: true, tipo: true, fechaVencimiento: true },
    });
    for (const d of deudas) {
      const fecha = d.fechaVencimiento!;
      const vencido = fecha < ahora;
      items.push({
        tipo: "deuda",
        titulo: d.tipo === "PAGAR" ? `Debés a ${d.contraparte}` : `Te debe ${d.contraparte}`,
        subtitulo: `${vencido ? "Venció" : "Vence"} el ${formatFecha(fecha)}`,
        vencido,
        href: "/deudas",
        orden: fecha.getTime(),
      });
    }

    // ─── Próximas cuotas sin pagar ──────────────────────────────────────────────
    const cuotas = await prisma.cuotaDeuda.findMany({
      where: {
        pagada: false,
        fechaVencimiento: { lte: limiteFecha },
        deuda: { usuarioId, estado: { in: ["PENDIENTE", "VENCIDA"] } },
      },
      orderBy: { fechaVencimiento: "asc" },
      select: { numero: true, fechaVencimiento: true, deuda: { select: { contraparte: true, tipo: true } } },
      take: 5,
    });
    for (const c of cuotas) {
      const vencido = c.fechaVencimiento < ahora;
      items.push({
        tipo: "deuda",
        titulo: `Cuota ${c.numero} — ${c.deuda.contraparte}`,
        subtitulo: `${vencido ? "Venció" : "Vence"} el ${formatFecha(c.fechaVencimiento)}`,
        vencido,
        href: "/deudas",
        orden: c.fechaVencimiento.getTime(),
      });
    }

    return items
      .sort((a, b) => (a.vencido !== b.vencido ? (a.vencido ? -1 : 1) : a.orden - b.orden))
      .map(({ orden, ...r }) => r);
  },
  ["recordatorios"],
  { revalidate: 300, tags: ["vehiculos", "deudas"] }
);
