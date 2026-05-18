// components/layout/mobile-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Car,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Inicio",        icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos",   icon: ArrowLeftRight },
  { href: "/empresas",     label: "Empresas",      icon: Building2 },
  { href: "/vehiculos",    label: "Vehículos",     icon: Car },
  { href: "/settings",     label: "Config",        icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon className={cn("size-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}