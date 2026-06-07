import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { cn } from "@/lib/cn";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Usuarios · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function UsuariosPage() {
  const session = await auth();
  if (!hasRole(session?.user?.roles, Role.SUPERADMIN)) redirect("/admin");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Usuarios</h1>
        <Link
          href="/admin/usuarios/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo usuario
        </Link>
      </div>

      <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
        {users.map((u) => (
          <li key={u.id}>
            <Link
              href={`/admin/usuarios/${u.id}`}
              className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-white">{u.name || u.email}</p>
                <p className="truncate text-sm text-brand-muted">{u.email} · {u.roles.join(", ")}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  u.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                )}
              >
                {u.isActive ? "Activo" : "Inactivo"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
