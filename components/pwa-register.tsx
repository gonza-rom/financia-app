// components/pwa-register.tsx
"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla el registro (ej. navegador sin soporte), no es crítico —
        // la app sigue funcionando normal, solo no queda instalable.
      });
    }
  }, []);

  return null;
}
