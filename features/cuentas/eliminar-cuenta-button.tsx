"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { eliminarCuentaAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface EliminarCuentaButtonProps {
  id: string;
  tieneTransacciones: boolean;
}

export function EliminarCuentaButton({ id, tieneTransacciones }: EliminarCuentaButtonProps) {
  const [confirmar, setConfirmar] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleEliminar() {
    startTransition(async () => {
      const result = await eliminarCuentaAction(id);
      if (result.success) {
        toast({
          title: tieneTransacciones ? "Cuenta desactivada" : "Cuenta eliminada",
          description: tieneTransacciones
            ? "La cuenta tiene transacciones y fue archivada."
            : undefined,
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  if (confirmar) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
        <span className="text-muted-foreground text-xs flex-1">
          {tieneTransacciones ? "Se archivará" : "¿Eliminar?"}
        </span>
        <button
          type="button"
          onClick={handleEliminar}
          disabled={isPending}
          className="text-xs text-destructive font-medium hover:underline"
        >
          {isPending ? "…" : "Confirmar"}
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="text-xs text-muted-foreground hover:underline"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <DropdownMenuItem
      onClick={(e) => { e.preventDefault(); setConfirmar(true); }}
      className="text-destructive focus:text-destructive"
    >
      <Trash2 className="size-3.5 mr-2" />
      {tieneTransacciones ? "Archivar" : "Eliminar"}
    </DropdownMenuItem>
  );
}