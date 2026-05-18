// types/deudas.ts

export type TipoDeuda = "cobrar" | "pagar"; // cobrar = me deben, pagar = yo debo
export type EstadoDeuda = "pendiente" | "pagada" | "vencida";
export type Moneda = "ARS" | "USD" | "EUR";

export interface Cuota {
  id: string;
  numero: number;
  monto: number;
  fechaVencimiento: string; // ISO date
  fechaPago?: string;       // ISO date, presente si fue pagada
  pagada: boolean;
}

export interface Deuda {
  id: string;
  tipo: TipoDeuda;
  estado: EstadoDeuda;

  /** Persona o empresa involucrada */
  contraparte: string;
  /** ID opcional si está vinculada a una empresa existente */
  empresaId?: string;

  descripcion?: string;

  moneda: Moneda;
  montoTotal: number;

  /** Si tiene cuotas, se usa este arreglo; si no, es pago único */
  cuotas?: Cuota[];

  /** Fecha de vencimiento para pagos únicos (sin cuotas) */
  fechaVencimiento?: string; // ISO date
  /** Fecha en que se saldó (para pagos únicos) */
  fechaPago?: string;        // ISO date

  creadaEn: string; // ISO datetime
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