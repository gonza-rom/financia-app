// types/cuentas.ts
import type { Cuenta, TipoCuenta } from "@prisma/client";

export type { Cuenta, TipoCuenta };

export interface CuentaConStats extends Cuenta {
  saldo: number;
  cantidadTransacciones: number;
  _count?: {
    transacciones: number;
  };
}

export interface FormularioCuenta {
  nombre: string;
  tipo: TipoCuenta;
  saldo: number;
  color: string;
  icono: string;
}

export const TIPOS_CUENTA: { value: TipoCuenta; label: string; icono: string }[] = [
  { value: "EFECTIVO",          label: "Efectivo",          icono: "banknote"    },
  { value: "BANCO",             label: "Banco",             icono: "landmark"    },
  { value: "BILLETERA_DIGITAL", label: "Billetera digital", icono: "wallet"      },
  { value: "INVERSION",         label: "Inversión",         icono: "trending-up" },
  { value: "OTRO",              label: "Otro",              icono: "circle"      },
];

export const COLORES_CUENTA = [
  "#00aaff", "#22c55e", "#f97316", "#8b5cf6",
  "#ef4444", "#14b8a6", "#f59e0b", "#6b7280",
];