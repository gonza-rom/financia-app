// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Settings,
  DollarSign,
  LogOut,
  Car,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Usuario } from "@/types";
import { logoutAction } from "@/features/auth/actions";
import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/categories",   label: "Categorías",    icon: Tag },
  { href: "/vehiculos",    label: "Vehículos",     icon: Car },
  { href: "/empresas",     label: "Empresas",      icon: Building2 },
  { href: "/settings",     label: "Configuración", icon: Settings },
];

interface SidebarProps {
  user: Usuario;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(() => logoutAction());
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-border h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2.5 border-b border-border">
        <div className="size-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <DollarSign className="size-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-base tracking-tight">Fintrack</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(user.nombre ?? user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.nombre ?? "Usuario"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground gap-3 px-3"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="size-4" />
          {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
        </Button>
      </div>
    </aside>
  );
}