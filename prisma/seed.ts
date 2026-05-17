// prisma/seed.ts
// Uso: SEED_USER_ID=8bd3bde4-2883-40a2-b276-e5ea95268b97 npx tsx prisma/seed.ts

import { PrismaClient, TipoTransaccion } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIAS_GASTO = [
  { nombre: "Vivienda",         color: "#3b82f6", icono: "home" },
  { nombre: "Comida",           color: "#f97316", icono: "utensils" },
  { nombre: "Transporte",       color: "#8b5cf6", icono: "car" },
  { nombre: "Salud",            color: "#ef4444", icono: "heart" },
  { nombre: "Entretenimiento",  color: "#ec4899", icono: "music" },
  { nombre: "Compras",          color: "#f59e0b", icono: "shopping-bag" },
  { nombre: "Educación",        color: "#14b8a6", icono: "book" },
  { nombre: "Servicios",        color: "#6b7280", icono: "zap" },
  { nombre: "Viajes",           color: "#06b6d4", icono: "plane" },
  { nombre: "Otros",            color: "#84cc16", icono: "more-horizontal" },
];

const CATEGORIAS_INGRESO = [
  { nombre: "Sueldo",           color: "#22c55e", icono: "briefcase" },
  { nombre: "Freelance",        color: "#10b981", icono: "laptop" },
  { nombre: "Inversiones",      color: "#3b82f6", icono: "trending-up" },
  { nombre: "Negocio",          color: "#8b5cf6", icono: "building" },
  { nombre: "Otros ingresos",   color: "#6b7280", icono: "plus-circle" },
];

async function main() {
  const usuarioId = process.env.SEED_USER_ID;

  if (!usuarioId) {
    console.error("❌  Definí la variable SEED_USER_ID antes de ejecutar el seed.");
    console.error("    Ejemplo: SEED_USER_ID=tu-user-id npx tsx prisma/seed.ts");
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    console.error(`❌  No se encontró el usuario ${usuarioId}. Iniciá sesión primero para crear el registro.`);
    process.exit(1);
  }

  console.log(`🌱  Creando categorías para ${usuario.email}…`);

  const existentes = await prisma.categoria.count({ where: { usuarioId } });
  if (existentes > 0) {
    console.log(`⚠️   El usuario ya tiene ${existentes} categorías. Se omite el seed.`);
    return;
  }

  await prisma.categoria.createMany({
    data: [
      ...CATEGORIAS_GASTO.map((c) => ({ ...c, tipo: TipoTransaccion.GASTO, usuarioId })),
      ...CATEGORIAS_INGRESO.map((c) => ({ ...c, tipo: TipoTransaccion.INGRESO, usuarioId })),
    ],
  });

  console.log(`✅  Se crearon ${CATEGORIAS_GASTO.length} categorías de gasto y ${CATEGORIAS_INGRESO.length} de ingreso.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());