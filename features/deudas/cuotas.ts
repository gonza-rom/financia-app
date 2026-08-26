// features/deudas/cuotas.ts
// Lógica pura de generación de cuotas — separada de actions.ts porque un archivo
// "use server" solo puede exportar funciones async (Next.js lo exige), y esto
// necesita quedar testeable.

export interface CuotaGenerada {
  numero: number;
  monto: number;
  fechaVencimiento: Date;
}

export function generarCuotas(montoTotal: number, cantidad: number, fechaInicio: Date): CuotaGenerada[] {
  const montoBase = Math.round((montoTotal / cantidad) * 100) / 100;
  const diaBase = fechaInicio.getDate();

  const cuotas = Array.from({ length: cantidad }, (_, i) => {
    const anio = fechaInicio.getFullYear();
    const mes = fechaInicio.getMonth() + i; // sin +1, empieza en el mes elegido

    const ultimoDia = new Date(anio, mes + 1, 0).getDate();
    const dia = Math.min(diaBase, ultimoDia);

    return {
      numero: i + 1,
      monto: montoBase,
      fechaVencimiento: new Date(anio, mes, dia),
    };
  });

  // La última cuota absorbe el redondeo para que la suma dé exacto el montoTotal
  const sumaPrevia = montoBase * (cantidad - 1);
  cuotas[cantidad - 1].monto = Math.round((montoTotal - sumaPrevia) * 100) / 100;

  return cuotas;
}
