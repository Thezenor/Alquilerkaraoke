import { Role } from "@/generated/prisma/enums";

/**
 * Roles con acceso al panel de administración.
 * COLABORADOR (externo) tendrá su propia área en fases posteriores.
 */
export const ADMIN_PANEL_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.ADMIN,
  Role.COMERCIAL,
  Role.TECNICO,
  Role.CONTABILIDAD,
  Role.SEO_CONTENIDOS,
  Role.ALMACEN,
];

/** ¿El usuario puede entrar al panel de administración? */
export function canAccessAdmin(roles: Role[] | undefined | null): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => ADMIN_PANEL_ROLES.includes(r));
}

/** ¿El usuario tiene alguno de los roles indicados? */
export function hasRole(roles: Role[] | undefined | null, ...allowed: Role[]): boolean {
  if (!roles?.length) return false;
  return roles.some((r) => allowed.includes(r));
}
