import type { IconName } from "./icons";
import { Role } from "@/generated/prisma/enums";
import { hasRole } from "@/lib/auth-roles";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  roles?: Role[]; // si se omite → visible para todo rol de panel
  exact?: boolean;
};
export type NavGroup = { label: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operativa",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
      { href: "/admin/reservas", label: "Reservas", icon: "calendar-check" },
      { href: "/admin/calendario", label: "Calendario", icon: "calendar" },
      { href: "/admin/clientes", label: "Clientes", icon: "users" },
      { href: "/admin/solicitudes", label: "Solicitudes", icon: "inbox" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/admin/servicios", label: "Servicios", icon: "sparkles" },
      { href: "/admin/packs", label: "Packs", icon: "box" },
      { href: "/admin/extras", label: "Extras", icon: "plus-circle" },
      { href: "/admin/colaboradores", label: "Colaboradores", icon: "link" },
    ],
  },
  {
    label: "Contenido",
    items: [
      { href: "/admin/blog", label: "Blog", icon: "file-text" },
      { href: "/admin/canciones", label: "Canciones", icon: "music" },
    ],
  },
  {
    label: "Precios",
    items: [
      { href: "/admin/tarifas", label: "Tarifas", icon: "tag" },
      { href: "/admin/recargos", label: "Recargos y fechas", icon: "percent" },
      { href: "/admin/descuentos", label: "Descuentos", icon: "ticket" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/configuracion", label: "Configuración", icon: "settings" },
      { href: "/admin/usuarios", label: "Usuarios", icon: "shield", roles: [Role.SUPERADMIN] },
    ],
  },
];

/** Filtra ítems por los roles de la sesión. */
export function filterNavByRoles(groups: NavGroup[], roles: Role[] | undefined): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.roles || hasRole(roles, ...it.roles)),
    }))
    .filter((g) => g.items.length > 0);
}
