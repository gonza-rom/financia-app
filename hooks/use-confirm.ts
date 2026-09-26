// hooks/use-confirm.ts
"use client";

// Reemplazo del confirm() nativo del navegador — mismo patrón de estado global
// en memoria que use-toast.ts, para poder llamarlo como una función imperativa
// (confirmDialog(...)) desde cualquier handler, sin tener que levantar estado
// local de "open" en cada componente que borra algo.
import * as React from "react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  id: string;
  resolve: (value: boolean) => void;
}

interface State {
  request: ConfirmRequest | null;
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { request: null };

function dispatch(state: State) {
  memoryState = state;
  listeners.forEach((listener) => listener(memoryState));
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    dispatch({ request: { ...options, id: genId(), resolve } });
  });
}

function respond(value: boolean) {
  memoryState.request?.resolve(value);
  dispatch({ request: null });
}

export function useConfirmDialogState() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    request: state.request,
    onConfirm: () => respond(true),
    onCancel: () => respond(false),
  };
}
