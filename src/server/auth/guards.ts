import { auth } from "@/server/auth";
import { canAccessAdmin, hasRole } from "@/lib/auth-roles";
import type { Role } from "@/generated/prisma/enums";

/** Garantiza sesión con acceso al panel. Lanza si no. Devuelve la sesión. */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    throw new Error("No autorizado para el panel de administración.");
  }
  return session;
}

/** Garantiza sesión con alguno de los roles indicados. Lanza si no. */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user || !hasRole(session.user.roles, ...roles)) {
    throw new Error("No tienes permisos para esta acción.");
  }
  return session;
}
