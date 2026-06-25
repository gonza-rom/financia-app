// types/index.ts
import type {
  Categoria,
  FrecuenciaRecurrente,
  ReglaRecurrente,
  Transaccion,
  TipoTransaccion,
  Usuario,
} from "@prisma/client";


// ─── Re-exports desde Prisma ─────────────────────────────────────────────────
export type { Categoria, FrecuenciaRecurrente, ReglaRecurrente, Transaccion, TipoTransaccion, Usuario };

// ─── Tipos extendidos ─────────────────────────────────────────────────────────
export type TransaccionConCategoria = Omit<Transaccion, 'monto'> & {
  monto: number;
  categoria: Categoria;
};

export type CategoriaConEstadisticas = Categoria & {
  _count: { transacciones: number };
  montoTotal: number;
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface EstadisticasDashboard {
  balanceTotal: number;
  patrimonioNeto: number;
  saldoTotalCuentas: number;   // ← NUEVO — suma de saldos de todas las cuentas activas
  porCobrarPendiente: number; 
  porPagarPendiente: number;
  ingresoMensual: number;
  gastoMensual: number;
  ahorroMensual: number;
  cambioIngreso: number;
  cambioGasto: number;
  tasaAhorro: number;
}

export interface DatosMensuales {
  mes: string;
  ingreso: number;
  gastos: number;
  ahorro: number;
}

export interface DesgloseCategoria {
  categoriaId: string;
  nombreCategoria: string;
  color: string;
  icono: string;
  monto: number;
  porcentaje: number;
  cantidad: number;
}

// ─── Formularios ──────────────────────────────────────────────────────────────
export interface FormularioTransaccion {
  monto: number;
  descripcion: string;
  tipo: TipoTransaccion;
  fecha: Date;
  categoriaId: string;
  esRecurrente: boolean;
  notas?: string;
  cuentaId?: string;
}

export interface FormularioCategoria {
  nombre: string;
  icono: string;
  color: string;
  tipo: TipoTransaccion;
}

// ─── Resultados de acciones ───────────────────────────────────────────────────
export type ResultadoAccion<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Paginación ───────────────────────────────────────────────────────────────
export interface ResultadoPaginado<T> {
  data: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
export interface FiltrosTransaccion {
  tipo?: TipoTransaccion;
  categoriaId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
}