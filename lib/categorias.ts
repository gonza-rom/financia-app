// lib/categorias.ts
// Helpers para la jerarquía de categorías (categoría padre -> subcategorías, un solo nivel).

export interface CategoriaBase {
  id: string;
  nombre: string;
  color: string;
  parentId: string | null;
}

export interface CategoriaConHijos<T extends CategoriaBase> {
  padre: T;
  hijos: T[];
}

// Agrupa una lista plana de categorías en padres + sus hijos directos.
// Las categorías cuyo parentId no está presente en la lista (no debería pasar,
// pero por las dudas) se tratan como si fueran de nivel superior.
export function agruparPorPadre<T extends CategoriaBase>(categorias: T[]): CategoriaConHijos<T>[] {
  const idsExistentes = new Set(categorias.map((c) => c.id));
  const principales = categorias.filter((c) => !c.parentId || !idsExistentes.has(c.parentId));

  return principales.map((padre) => ({
    padre,
    hijos: categorias.filter((c) => c.parentId === padre.id),
  }));
}
