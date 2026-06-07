import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { CollaboratorForm, type CollaboratorFormValues } from "../collaborator-form";

export const metadata: Metadata = {
  title: "Nuevo colaborador · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: CollaboratorFormValues = {
  name: "",
  url: "",
  logoUrl: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

export default async function NewCollaboratorPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  return (
    <div>
      <Link href="/admin/colaboradores" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a colaboradores
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo colaborador</h1>
      <div className="mt-8">
        <CollaboratorForm values={empty} />
      </div>
    </div>
  );
}
