// components/layout/mobile-nav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Car,
  Settings,
  Tag,
  Building2,
  Wallet,
  BarChart2,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TransactionDialog } from "@/features/transactions/transaction-dialog";
import { openGlobalSearch } from "@/hooks/use-global-search";
import type { Categoria } from "@/types";

// Solo los 4 accesos más frecuentes van fijos en la barra — el resto vive en "Más".
// Con 9 items en una fila de 375px de ancho, cada uno queda con ~41px: los labels
// largos ("Vehículos", "Configuración") se cortaban o desbordaban.
// Van 2 a cada lado del botón central de "nueva transacción" (patrón tab-bar con
// FAB incrustado, tipo Instagram/Mercado Pago).
const NAV_IZQUIERDA = [
  { href: "/dashboard",    label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Trans",     icon: ArrowLeftRight },
];

const NAV_DERECHA = [
  { href: "/cuentas", label: "Cuentas", icon: Wallet },
  { href: "/deudas",  label: "Deudas",  icon: Landmark },
];

const NAV_MAS = [
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart2 },
  { href: "/categories",   label: "Categorías",   icon: Tag },
  { href: "/vehiculos",    label: "Vehículos",    icon: Car },
  { href: "/empresas",     label: "Empresas",     icon: Building2 },
  { href: "/settings",     label: "Configuración", icon: Settings },
];

function NavLink({ href, label, Icon, isActive }: { href: string; label: string; Icon: typeof LayoutDashboard; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {isActive && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
      )}
      <Icon className={cn("size-5 transition-transform duration-150", isActive && "scale-110")} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}

type CuentaSimple = {
  id: string;
  nombre: string;
  tipo: string;
  color: string;
};

interface MobileNavProps {
  categorias: Categoria[];
  cuentas: CuentaSimple[];
}

export function MobileNav({ categorias, cuentas }: MobileNavProps) {
  const pathname = usePathname();
  const enMas = NAV_MAS.some((item) => pathname.startsWith(item.href));
  const [nuevaTransaccionOpen, setNuevaTransaccionOpen] = useState(false);

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        md:hidden
        bg-card/95 backdrop-blur-md
        border-t border-border
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-16">
        {NAV_IZQUIERDA.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon}
            isActive={pathname.startsWith(item.href)} />
        ))}

        {/* Botón central incrustado — sobresale de la barra, patrón tab-bar con FAB */}
        <div className="relative flex-1 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setNuevaTransaccionOpen(true)}
            aria-label="Nueva transacción"
            className="
              absolute -top-5
              size-12 rounded-full
              bg-primary text-primary-foreground
              shadow-lg shadow-primary/30
              flex items-center justify-center
              ring-4 ring-background
              transition-transform active:scale-95
            "
          >
            <Plus className="size-6" />
          </button>
        </div>

        {NAV_DERECHA.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} Icon={item.icon}
            isActive={pathname.startsWith(item.href)} />
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors relative",
                enMas ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {enMas && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <MoreHorizontal className={cn("size-5 transition-transform duration-150", enMas && "scale-110")} />
              <span className="text-[10px] font-medium leading-none">Más</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={8} className="mb-1">
            <DropdownMenuItem onSelect={() => openGlobalSearch()} className="flex items-center gap-2">
              <Search className="size-4" /> Buscar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {NAV_MAS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <DropdownMenuItem key={item.href} asChild className={cn(isActive && "text-primary")}>
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="size-4" /> {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionDialog
        categorias={categorias}
        cuentas={cuentas}
        open={nuevaTransaccionOpen}
        onOpenChange={setNuevaTransaccionOpen}
      />
    </nav>
  );
}
