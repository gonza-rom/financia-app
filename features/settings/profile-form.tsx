// src/features/settings/profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { updateProfileAction } from "./actions";

interface ProfileFormData {
  name: string;
  currency: string;
}

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "ARS", label: "ARS — Argentine Peso" },
  { value: "BRL", label: "BRL — Brazilian Real" },
  { value: "MXN", label: "MXN — Mexican Peso" },
  { value: "CLP", label: "CLP — Chilean Peso" },
  { value: "COP", label: "COP — Colombian Peso" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
];

export function ProfileForm({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const { register, handleSubmit, setValue } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name ?? "",
      currency: user.currency,
    },
  });

  function onSubmit(data: ProfileFormData) {
    startTransition(async () => {
      const result = await updateProfileAction(data);
      if (result.success) {
        toast({ title: "Profile updated" });
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
        <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input id="name" {...register("name")} />
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>
        <Select
          defaultValue={user.currency}
          onValueChange={(v) => setValue("currency", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}