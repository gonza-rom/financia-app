// types/deudas.ts

export type TipoDeuda = "cobrar" | "pagar";
export type EstadoDeuda = "pendiente" | "pagada" | "vencida";
export type Moneda = "ARS" | "USD" | "EUR";

export interface CuotaDeuda {
  id: string;
  numero: number;
  monto: number;
  fechaVencimiento: string; // ISO date
  fechaPago?: string;       // ISO date, presente si fue pagada
  pagada: boolean;
}

export interface PagoDeuda {
  id: string;
  monto: number;
  fecha: string;    // ISO date
  notas?: string;
  creadoEn: string; // ISO datetime
}

export interface Deuda {
  id: string;
  tipo: TipoDeuda;
  estado: EstadoDeuda;
  contraparte: string;
  empresaId?: string;
  descripcion?: string;
  moneda: Moneda;
  montoTotal: number;
  montoPagado: number;      // suma de pagos parciales o cuotas pagadas
  fechaVencimiento?: string;
  fechaPago?: string;
  cuotas?: CuotaDeuda[];
  pagos?: PagoDeuda[];
  creadaEn: string;
  actualizadaEn: string;
}

/** DTO para crear/editar una deuda */
export interface DeudaFormValues {
  tipo: TipoDeuda;
  contraparte: string;
  empresaId?: string;
  descripcion?: string;
  moneda: Moneda;
  montoTotal: number;
  tieneCuotas: boolean;
  cantidadCuotas?: number;
  fechaVencimiento?: string;
}

/** Resumen calculado para los totales del header */
export interface ResumenDeudas {
  totalCobrar: number;
  totalPagar: number;
  moneda: Moneda;
  vencidas: number;
}