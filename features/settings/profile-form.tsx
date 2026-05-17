// features/settings/profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Usuario } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAction } from "./actions";

interface FormularioPerfil {
  nombre: string;
  moneda: string;
}

const MONEDAS = [
  { value: "ARS", label: "ARS — Peso Argentino" },
  { value: "USD", label: "USD — Dólar Estadounidense" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "BRL", label: "BRL — Real Brasileño" },
  { value: "CLP", label: "CLP — Peso Chileno" },
  { value: "MXN", label: "MXN — Peso Mexicano" },
  { value: "COP", label: "COP — Peso Colombiano" },
  { value: "UYU", label: "UYU — Peso Uruguayo" },
  { value: "GBP", label: "GBP — Libra Esterlina" },
  { value: "JPY", label: "JPY — Yen Japonés" },
];

export function ProfileForm({ user }: { user: Usuario }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue } = useForm<FormularioPerfil>({
    defaultValues: {
      nombre: user.nombre ?? "",
      moneda: user.moneda,
    },
  });

  function onSubmit(data: FormularioPerfil) {
    startTransition(async () => {
      const result = await updateProfileAction(data);
      if (result.success) {
        toast({ title: "Perfil actualizado" });
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={user.email} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">El email no se puede cambiar aquí.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...register("nombre")} />
      </div>
      <div className="space-y-2">
        <Label>Moneda</Label>
        <Select defaultValue={user.moneda} onValueChange={(v) => setValue("moneda", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONEDAS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar Cambios"}
      </Button>
    </form>
  );
}