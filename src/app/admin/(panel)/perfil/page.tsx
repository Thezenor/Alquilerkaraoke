import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { RoleBadges } from "@/components/admin/role-badges";
import { ProfileForm, PasswordForm } from "./perfil-forms";

export const metadata: Metadata = {
  title: "Mi cuenta · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const DATE_FORMAT = "dd/MM/yyyy HH:mm";

/** Página de cuenta propia: disponible para cualquier usuario del panel. */
export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      roles: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!user) redirect("/admin/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Mi cuenta</h1>
      <p className="text-brand-muted mt-1 text-sm">Tus datos de acceso al panel.</p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Datos de la cuenta (solo lectura salvo el nombre) */}
          <section className="border-brand-border bg-brand-surface rounded-xl border p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white">Datos</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-brand-muted">Email (no editable)</dt>
                <dd className="text-brand-text mt-0.5 break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">Roles</dt>
                <dd className="mt-1.5">
                  <RoleBadges roles={user.roles} />
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
            <div className="border-brand-border mt-6 border-t pt-5">
              <ProfileForm name={user.name ?? ""} />
            </div>
          </section>
        </div>

        {/* Cambio de contraseña */}
        <section className="border-brand-border bg-brand-surface rounded-xl border p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white">Cambiar contraseña</h2>
          <p className="text-brand-muted mt-1 text-xs">
            Por seguridad debes introducir tu contraseña actual.
          </p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
