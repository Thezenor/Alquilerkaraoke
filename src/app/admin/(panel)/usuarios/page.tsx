import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { cn } from "@/lib/cn";
import { Role } from "@/generated/prisma/enums";
import { RoleBadges } from "@/components/admin/role-badges";

export const metadata: Metadata = {
  title: "Usuarios · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const DATE_FORMAT = "dd/MM/yyyy HH:mm";

export default async function UsuariosPage() {
  const session = await auth();
  if (!hasRole(session?.user?.roles, Role.SUPERADMIN)) redirect("/admin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Usuarios</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {users.length} {users.length === 1 ? "usuario" : "usuarios"}
          </p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
          className="bg-brand-neon text-brand-bg hover:bg-brand-neon-strong shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition"
        >
          Nuevo usuario
        </Link>
      </div>

      <ul className="divide-brand-border border-brand-border bg-brand-surface mt-8 divide-y overflow-hidden rounded-xl border">
        {users.map((u) => (
          <li key={u.id}>
            <Link
              href={`/admin/usuarios/${u.id}`}
              className="hover:bg-brand-surface-2 flex flex-col gap-3 px-4 py-4 transition sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{u.name || u.email}</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      u.isActive
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-500/15 text-slate-300",
                    )}
                  >
                    {u.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-brand-muted mt-0.5 truncate text-sm">{u.email}</p>
                <RoleBadges roles={u.roles} className="mt-2" />
              </div>
              <div className="text-brand-muted shrink-0 text-xs sm:text-right">
                <p>Alta: {format(u.createdAt, DATE_FORMAT)}</p>
                <p className="mt-0.5">
                  Último acceso: {u.lastLoginAt ? format(u.lastLoginAt, DATE_FORMAT) : "Nunca"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
