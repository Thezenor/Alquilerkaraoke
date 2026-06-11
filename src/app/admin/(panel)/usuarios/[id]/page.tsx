import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { Role } from "@/generated/prisma/enums";
import { UserForm, type UserFormValues } from "../user-form";
import { DeleteUserForm } from "../delete-user-form";

export const metadata: Metadata = {
  title: "Editar usuario · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const DATE_FORMAT = "dd/MM/yyyy HH:mm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasRole(session?.user?.roles, Role.SUPERADMIN)) redirect("/admin");

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  // Últimas acciones del usuario (auditoría). No existe página de auditoría global todavía.
  const auditEntries = await prisma.auditLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, action: true, entity: true, entityId: true, createdAt: true },
  });

  const values: UserFormValues = {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
  };
  const isSelf = user.id === session?.user?.id;

  return (
    <div>
      <Link href="/admin/usuarios" className="text-brand-muted text-sm transition hover:text-white">
        ← Volver a usuarios
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {user.name || user.email}</h1>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <UserForm values={values} />

        <div className="space-y-6">
          {/* Metadatos de la cuenta */}
          <section className="border-brand-border bg-brand-surface rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-white">Cuenta</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-brand-muted">Estado</dt>
                <dd className={user.isActive ? "text-emerald-300" : "text-slate-300"}>
                  {user.isActive ? "Activo" : "Inactivo"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brand-muted">Alta</dt>
                <dd className="text-brand-text">{format(user.createdAt, DATE_FORMAT)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brand-muted">Último acceso</dt>
                <dd className="text-brand-text">
                  {user.lastLoginAt ? format(user.lastLoginAt, DATE_FORMAT) : "Nunca"}
                </dd>
              </div>
            </dl>
          </section>

          {/* Últimas acciones (auditoría) */}
          <section className="border-brand-border bg-brand-surface rounded-xl border p-5">
            <h2 className="text-sm font-semibold text-white">Últimas acciones</h2>
            {auditEntries.length === 0 ? (
              <p className="text-brand-muted mt-3 text-sm">Sin actividad registrada.</p>
            ) : (
              <ul className="divide-brand-border/60 mt-3 divide-y">
                {auditEntries.map((entry) => (
                  <li key={entry.id} className="py-2 first:pt-0 last:pb-0">
                    <p className="text-brand-text text-sm">
                      {entry.action}
                      {entry.entity && <span className="text-brand-muted"> · {entry.entity}</span>}
                    </p>
                    <p className="text-brand-muted mt-0.5 text-xs">
                      {format(entry.createdAt, DATE_FORMAT)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Zona de peligro: eliminar usuario (nunca a uno mismo) */}
          {!isSelf && (
            <section className="bg-brand-surface rounded-xl border border-red-500/30 p-5">
              <h2 className="text-sm font-semibold text-red-400">Zona de peligro</h2>
              <p className="text-brand-muted mt-2 text-xs">
                El borrado es definitivo. La auditoría histórica se conserva de forma anónima. Si el
                usuario debe dejar de entrar, normalmente basta con desactivarlo.
              </p>
              <div className="mt-4">
                <DeleteUserForm userId={user.id} userLabel={user.name || user.email} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
