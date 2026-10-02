// app/settings/page.tsx
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/features/settings/profile-form";
import { ThemeToggle } from "@/features/settings/theme-toggle";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const usuario = await getCurrentUser();
  return (
    <div className="space-y-6 animate-fade-in max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Administrá tu cuenta</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Perfil</h2>
        <ProfileForm user={usuario} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-1">Apariencia</h2>
        <p className="text-xs text-muted-foreground mb-4">Elegí cómo se ve la app en este dispositivo.</p>
        <ThemeToggle />
      </div>
    </div>
  );
}