"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/packs", label: "Packs" },
  { href: "/admin/extras", label: "Extras" },
  { href: "/admin/tarifas", label: "Tarifas" },
  { href: "/admin/configuracion", label: "Configuración empresa" },
];

export function AdminNav({ canManageUsers = false }: { canManageUsers?: boolean }) {
  const pathname = usePathname();
  const items = canManageUsers ? [...ITEMS, { href: "/admin/usuarios", label: "Usuarios" }] : ITEMS;

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition",
              active
                ? "bg-brand-surface-2 text-white"
                : "text-brand-muted hover:bg-brand-surface hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
