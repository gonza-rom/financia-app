// types/empresas.ts
import type {
  Empresa, Cliente, Proyecto, CobroProyecto,
  GastoEmpresa, EstadoProyecto, TipoCobroProyecto, EstadoCobro
} from "@prisma/client";

export type { Empresa, Cliente, Proyecto, CobroProyecto, GastoEmpresa, EstadoProyecto, TipoCobroProyecto, EstadoCobro };

export type CobroSerializado = Omit<CobroProyecto, 'monto'> & { monto: number };
export type GastoEmpresaSerializado = Omit<GastoEmpresa, 'monto'> & { monto: number };

export type ProyectoConCobros = Omit<Proyecto, 'montoTotal'> & {
  montoTotal: number | null;
  cliente: Cliente | null;
  cobros: CobroSerializado[];
  totalCobrado: number;
  totalPendiente: number;
};

export type ClienteConProyectos = Cliente & {
  proyectos: ProyectoConCobros[];
  totalGenerado: number;
};

export type EmpresaResumen = Empresa & {
  clientes: Cliente[];
  _count: { proyectos: number; clientes: number };
  totalIngresos: number;
  totalGastos: number;
  gananciaNeta: number;
};

export type EmpresaDetalle = Empresa & {
  clientes: ClienteConProyectos[];
  proyectos: ProyectoConCobros[];
  gastos: GastoEmpresaSerializado[];
  totalIngresos: number;
  totalGastos: number;
  gananciaNeta: number;
};

export interface FormularioEmpresa {
  nombre: string;
  descripcion?: string;
  color: string;
  logo?: string;
  moneda: string;
}

export interface FormularioCliente {
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface FormularioProyecto {
  nombre: string;
  descripcion?: string;
  tipoCobro: TipoCobroProyecto;
  montoTotal?: number;
  clienteId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface FormularioCobro {
  descripcion: string;
  monto: number;
  fechaEstimada?: Date;
}

export interface FormularioGastoEmpresa {
  descripcion: string;
  monto: number;
  fecha: Date;
  notas?: string;
  transferirAPersonal?: boolean;
  categoriaId?: string;
}