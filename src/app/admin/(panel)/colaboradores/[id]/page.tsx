import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { CollaboratorForm, type CollaboratorFormValues } from "../collaborator-form";
import { deleteCollaborator } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: "Editar colaborador · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditCollaboratorPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const c = await prisma.collaborator.findUnique({ where: { id } });
  if (!c) notFound();

  const values: CollaboratorFormValues = {
    id: c.id,
    name: c.name,
    url: c.url ?? "",
    logoUrl: c.logoUrl ?? "",
    description: c.description ?? "",
    sortOrder: String(c.sortOrder),
    isActive: c.isActive,
  };

  return (
    <div>
      <Link href="/admin/colaboradores" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a colaboradores
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {c.name}</h1>
      <div className="mt-8">
        <CollaboratorForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar colaborador</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer.</p>
        <form action={deleteCollaborator} className="mt-3">
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar este colaborador?"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
