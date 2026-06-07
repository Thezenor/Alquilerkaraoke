import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { Role } from "@/generated/prisma/enums";
import { UserForm, type UserFormValues } from "../user-form";

export const metadata: Metadata = {
  title: "Editar usuario · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasRole(session?.user?.roles, Role.SUPERADMIN)) redirect("/admin");

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const values: UserFormValues = {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
  };

  return (
    <div>
      <Link href="/admin/usuarios" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a usuarios
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {user.name || user.email}</h1>
      <div className="mt-8">
        <UserForm values={values} />
      </div>
    </div>
  );
}
