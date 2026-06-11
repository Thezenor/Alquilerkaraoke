import { cn } from "@/lib/cn";
import { Role } from "@/generated/prisma/enums";

/** Etiqueta legible de cada rol (fuente única para listas, formularios y perfil). */
export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Administrador",
  COMERCIAL: "Comercial",
  TECNICO: "Técnico",
  COLABORADOR: "Colaborador",
  CONTABILIDAD: "Contabilidad",
  SEO_CONTENIDOS: "SEO / Contenidos",
  ALMACEN: "Almacén",
};

// SUPERADMIN destacado en cian de marca, ADMIN en magenta; el resto neutros.
const ROLE_STYLES: Partial<Record<Role, string>> = {
  SUPERADMIN: "bg-brand-neon/15 text-brand-neon",
  ADMIN: "bg-fuchsia-500/15 text-fuchsia-300",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        ROLE_STYLES[role] ?? "bg-slate-500/15 text-slate-300",
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

export function RoleBadges({ roles, className }: { roles: Role[]; className?: string }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {roles.map((r) => (
        <RoleBadge key={r} role={r} />
      ))}
    </span>
  );
}
