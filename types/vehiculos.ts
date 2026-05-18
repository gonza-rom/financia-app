// types/vehiculos.ts
import type { Vehiculo, SeccionVehiculo, GastoVehiculo } from "@prisma/client";
export type { Vehiculo, SeccionVehiculo, GastoVehiculo };

export type SeccionConGastos = SeccionVehiculo & {
  gastos: GastoVehiculo[];
  _count: { gastos: number };
  totalGastado: number;
};

export type VehiculoConSecciones = Vehiculo & {
  secciones: SeccionConGastos[];
  _count: { gastos: number };
  totalGastado: number;
};

export type VehiculoResumen = Vehiculo & {
  _count: { gastos: number };
  totalGastado: number;
  secciones: SeccionVehiculo[];
};

export interface FormularioVehiculo {
  nombre: string;
  marca: string;
  modelo: string;
  anio: number;
  patente?: string;
  color: string;
  kilometraje?: number;
}

export interface FormularioSeccion {
  nombre: string;
  icono: string;
  color: string;
}

export interface FormularioGastoVehiculo {
  monto: number;
  fecha: Date;
  descripcion: string;
  notas?: string;
  kilometraje?: number;
  litros?: number;
  precioPorUnidad?: number;
  vencimiento?: Date;
  proximoKm?: number;
}

export const ICONOS_SECCION = [
  { valor: "fuel",        label: "Combustible" },
  { valor: "shield",      label: "Seguro" },
  { valor: "wrench",      label: "Herramienta" },
  { valor: "zap",         label: "Energía/GNC" },
  { valor: "car",         label: "Auto" },
  { valor: "rotate-cw",   label: "Service" },
  { valor: "alert-circle",label: "Multa" },
  { valor: "file-text",   label: "Patente" },
  { valor: "thermometer", label: "Mecánico" },
  { valor: "settings",    label: "General" },
];

export const COLORES_SECCION = [
  "#3b82f6", "#22c55e", "#f97316", "#ef4444",
  "#8b5cf6", "#f59e0b", "#14b8a6", "#ec4899",
  "#6b7280", "#06b6d4",
];

export const SECCIONES_PREDEFINIDAS: FormularioSeccion[] = [
  { nombre: "Nafta",        icono: "fuel",      color: "#f97316" },
  { nombre: "Seguro",       icono: "shield",    color: "#3b82f6" },
  { nombre: "Mantenimiento",icono: "wrench",    color: "#8b5cf6" },
  { nombre: "GNC",          icono: "zap",       color: "#22c55e" },
];