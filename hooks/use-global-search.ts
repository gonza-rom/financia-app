// hooks/use-global-search.ts
"use client";

// Estado global en memoria (mismo patrón que use-toast/use-confirm) para poder
// abrir el buscador desde cualquier lado — Sidebar, menú "Más" en mobile, o el
// atajo de teclado — sin duplicar el diálogo en cada lugar que lo dispara.
import * as React from "react";

const listeners: Array<(open: boolean) => void> = [];
let memoryOpen = false;

function dispatch(open: boolean) {
  memoryOpen = open;
  listeners.forEach((listener) => listener(memoryOpen));
}

export function openGlobalSearch() {
  dispatch(true);
}

export function useGlobalSearchOpen() {
  const [open, setOpen] = React.useState(memoryOpen);

  React.useEffect(() => {
    listeners.push(setOpen);
    return () => {
      const index = listeners.indexOf(setOpen);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return [open, dispatch] as const;
}
