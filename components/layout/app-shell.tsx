// components/layout/app-shell.tsx
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import type { Usuario } from "@/types";

interface AppShellProps {
  user: Usuario;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — solo visible en md+ */}
      <Sidebar user={user} />

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {/* pb-20 en mobile para que la bottom nav no tape contenido */}
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — solo visible en mobile */}
      <MobileNav />
    </div>
  );
}