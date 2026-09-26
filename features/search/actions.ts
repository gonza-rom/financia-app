// features/search/actions.ts
"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface ResultadoBusqueda {
  transacciones: { id: string; descripcion: string; monto: number; fecha: string; tipo: string }[];
  deudas: { id: string; contraparte: string; descripcion: string | null; tipo: string }[];
  empresas: {
    id: string;
    nombre: string;
    tipo: "empresa" | "proyecto";
    empresaId?: string;
    empresaNombre?: string;
  }[];
  vehiculos: { id: string; nombre: string; detalle: string }[];
}

const VACIO: ResultadoBusqueda = { transacciones: [], deudas: [], empresas: [], vehiculos: [] };

// Búsqueda global liviana — 5 resultados por tipo, alcanza para saltar directo a
// lo que estás buscando sin tener que recordar en qué sección vive.
export async function buscarGlobal(query: string): Promise<ResultadoBusqueda> {
  const q = query.trim();
  if (q.length < 2) return VACIO;

  const usuario = await getCurrentUser();

  const [transacciones, deudas, empresas, proyectos, vehiculos] = await Promise.all([
    prisma.transaccion.findMany({
      where: { usuarioId: usuario.id, descripcion: { contains: q, mode: "insensitive" } },
      orderBy: { fecha: "desc" },
      take: 5,
    }),
    prisma.deuda.findMany({
      where: {
        usuarioId: usuario.id,
        OR: [
          { contraparte: { contains: q, mode: "insensitive" } },
          { descripcion: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
    prisma.empresa.findMany({
      where: { usuarioId: usuario.id, activo: true, nombre: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.proyecto.findMany({
      where: { empresa: { usuarioId: usuario.id }, nombre: { contains: q, mode: "insensitive" } },
      include: { empresa: { select: { id: true, nombre: true } } },
      take: 5,
    }),
    prisma.vehiculo.findMany({
      where: {
        usuarioId: usuario.id,
        activo: true,
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { marca: { contains: q, mode: "insensitive" } },
          { modelo: { contains: q, mode: "insensitive" } },
          { patente: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  return {
    transacciones: transacciones.map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      monto: Number(t.monto),
      fecha: t.fecha.toISOString(),
      tipo: t.tipo,
    })),
    deudas: deudas.map((d) => ({
      id: d.id,
      contraparte: d.contraparte,
      descripcion: d.descripcion,
      tipo: d.tipo,
    })),
    empresas: [
      ...empresas.map((e) => ({ id: e.id, nombre: e.nombre, tipo: "empresa" as const })),
      ...proyectos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        tipo: "proyecto" as const,
        empresaId: p.empresa.id,
        empresaNombre: p.empresa.nombre,
      })),
    ].slice(0, 5),
    vehiculos: vehiculos.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      detalle: [v.marca, v.modelo].filter(Boolean).join(" "),
    })),
  };
}
