// app/auth/login/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">Ingresá a tu cuenta</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <Link href="/auth/register" className="text-primary hover:underline font-medium">
          Creá una
        </Link>
      </p>
    </div>
  );
}