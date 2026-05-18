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
    <div className="flex h-dvh bg-background">
      {/* Sidebar — solo visible en md+ */}
      <Sidebar user={user} />

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/*
          pb-[calc(4rem+env(safe-area-inset-bottom))] en mobile
          para que la bottom nav no tape el contenido, incluye el notch
        */}
        <div
          className="
            p-4 md:p-6 lg:p-8
            max-w-7xl mx-auto
            pb-[calc(4rem+env(safe-area-inset-bottom,0px))]
            md:pb-8
          "
        >
          {children}
        </div>
      </main>

      {/* Bottom nav — solo visible en mobile */}
      <MobileNav />
    </div>
  );
}