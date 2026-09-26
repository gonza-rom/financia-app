// components/ui/confirm-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirmDialogState } from "@/hooks/use-confirm";

export function ConfirmDialog() {
  const { request, onConfirm, onCancel } = useConfirmDialogState();

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
        </DialogHeader>

        {request?.description && (
          <p className="text-sm text-muted-foreground -mt-2">{request.description}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            {request?.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            type="button"
            variant={request?.destructive ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
          >
            {request?.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
