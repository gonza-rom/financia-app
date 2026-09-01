// lib/cuentas.ts
import { prisma } from "@/lib/prisma";
import type { Prisma, TipoTransaccion } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

export async function validarCuenta(usuarioId: string, cuentaId: string | undefined | null): Promise<boolean> {
  if (!cuentaId) return true;
  const cuenta = await prisma.cuenta.findFirst({ where: { id: cuentaId, usuarioId } });
  return !!cuenta;
}

export async function ajustarSaldoCuenta(
  tx: TxClient,
  cuentaId: string,
  tipo: TipoTransaccion,
  monto: number
) {
  await tx.cuenta.update({
    where: { id: cuentaId },
    data: { saldo: { increment: tipo === "INGRESO" ? monto : -monto } },
  });
}

export async function revertirSaldoCuenta(
  tx: TxClient,
  cuentaId: string,
  tipo: TipoTransaccion,
  monto: number
) {
  await ajustarSaldoCuenta(tx, cuentaId, tipo === "INGRESO" ? "GASTO" : "INGRESO", monto);
}
