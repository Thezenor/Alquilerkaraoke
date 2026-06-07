import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { hasRole } from "@/lib/auth-roles";
import { Role } from "@/generated/prisma/enums";
import { UserForm, type UserFormValues } from "../user-form";

export const metadata: Metadata = {
  title: "Nuevo usuario · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: UserFormValues = { name: "", email: "", roles: ["COMERCIAL"], isActive: true };

export default async function NewUserPage() {
  const session = await auth();
  if (!hasRole(session?.user?.roles, Role.SUPERADMIN)) redirect("/admin");

  return (
    <div>
      <Link href="/admin/usuarios" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a usuarios
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo usuario</h1>
      <div className="mt-8">
        <UserForm values={empty} />
      </div>
    </div>
  );
}
