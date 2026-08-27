// prisma/seed-subcategorias.ts
// Carga la taxonomía de categorías con subcategorías propuesta para el usuario.
// No toca ni borra categorías existentes — todo lo que crea es nuevo, en paralelo.
// Uso: SEED_USER_ID=<id> npx tsx prisma/seed-subcategorias.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient, TipoTransaccion } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Mismo preset de colores que usa el diálogo de categorías (features/categories/category-dialog.tsx),
// uno por grupo — las subcategorías heredan el color de su padre.
const COLORES = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#06b6d4", "#84cc16", "#a855f7",
];

interface GrupoCategoria {
  nombre: string;
  tipo: TipoTransaccion;
  subcategorias: string[];
}

const TAXONOMIA: GrupoCategoria[] = [
  {
    nombre: "Ingresos",
    tipo: "INGRESO",
    subcategorias: [
      "Sueldo", "Trabajo freelance", "Negocio / emprendimiento", "Ventas",
      "Inversiones", "Intereses / rendimientos", "Transferencias recibidas", "Otros ingresos",
    ],
  },
  {
    nombre: "Vivienda",
    tipo: "GASTO",
    subcategorias: ["Alquiler", "Expensas", "Servicios", "Internet", "Mantenimiento", "Muebles / electrodomésticos", "Impuestos"],
  },
  {
    nombre: "Alimentación",
    tipo: "GASTO",
    subcategorias: ["Supermercado", "Restaurantes", "Delivery", "Comida rápida", "Bebidas"],
  },
  {
    nombre: "Transporte",
    tipo: "GASTO",
    subcategorias: [
      "Combustible", "Mantenimiento", "Repuestos", "Mecánico / mano de obra", "Seguro",
      "Patente", "Lavado", "Estacionamiento", "Peajes", "Accesorios", "Multas",
    ],
  },
  {
    nombre: "Finanzas",
    tipo: "GASTO",
    subcategorias: [
      "Pago de tarjeta", "Préstamos", "Cuotas", "Comisiones bancarias",
      "Intereses", "Transferencias entre cuentas", "Inversiones", "Ahorros",
    ],
  },
  {
    nombre: "Compras",
    tipo: "GASTO",
    subcategorias: ["Ropa", "Tecnología", "Hogar", "Electrónica", "Accesorios", "Regalos", "Compras online"],
  },
  {
    nombre: "Salud",
    tipo: "GASTO",
    subcategorias: ["Medicamentos", "Consultas", "Estudios", "Odontología", "Óptica", "Seguro / cobertura"],
  },
  {
    nombre: "Ocio y entretenimiento",
    tipo: "GASTO",
    subcategorias: ["Streaming", "Videojuegos", "Cine", "Salidas", "Eventos", "Hobbies", "Suscripciones"],
  },
  {
    nombre: "Personal",
    tipo: "GASTO",
    subcategorias: ["Gimnasio", "Deportes", "Peluquería", "Cuidado personal", "Educación", "Cursos"],
  },
  {
    nombre: "Comunicación",
    tipo: "GASTO",
    subcategorias: ["Celular", "Internet", "Telefonía", "Servicios digitales"],
  },
  {
    nombre: "Impuestos y obligaciones",
    tipo: "GASTO",
    subcategorias: ["Monotributo", "Ingresos Brutos", "Impuestos", "Tasas", "Multas", "Otros"],
  },
  {
    nombre: "Otros",
    tipo: "GASTO",
    subcategorias: ["Donaciones", "Gastos varios", "Gastos no categorizados"],
  },
];

async function main() {
  const usuarioId = process.env.SEED_USER_ID;

  if (!usuarioId) {
    console.error("❌  Definí la variable SEED_USER_ID antes de ejecutar el seed.");
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    console.error(`❌  No se encontró el usuario ${usuarioId}.`);
    process.exit(1);
  }

  console.log(`🌱  Cargando taxonomía para ${usuario.email}…`);

  let creadasPadres = 0;
  let creadasHijos = 0;

  for (let i = 0; i < TAXONOMIA.length; i++) {
    const grupo = TAXONOMIA[i];
    const color = COLORES[i % COLORES.length];

    const padre = await prisma.categoria.create({
      data: {
        nombre: grupo.nombre,
        tipo: grupo.tipo,
        color,
        usuarioId,
      },
    });
    creadasPadres++;

    if (grupo.subcategorias.length > 0) {
      await prisma.categoria.createMany({
        data: grupo.subcategorias.map((nombre) => ({
          nombre,
          tipo: grupo.tipo,
          color,
          usuarioId,
          parentId: padre.id,
        })),
      });
      creadasHijos += grupo.subcategorias.length;
    }

    console.log(`  ✓ ${grupo.nombre} (${grupo.subcategorias.length} subcategorías)`);
  }

  console.log(`✅  Listo: ${creadasPadres} categorías principales y ${creadasHijos} subcategorías creadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
