// app/auth/register/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">Empezá a registrar tus finanzas hoy</p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">
          Ingresá
        </Link>
      </p>
    </div>
  );
}