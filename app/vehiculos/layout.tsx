// app/vehiculos/layout.tsx
import { Sidebar } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function VehiculosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getCurrentUser();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={usuario} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}