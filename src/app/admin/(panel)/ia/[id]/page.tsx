import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ProviderForm, type ProviderFormValues } from "../provider-form";
import { deleteAiProvider } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar proveedor de IA · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditAiProviderPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const p = await prisma.aiProvider.findUnique({ where: { id } });
  if (!p) notFound();

  const values: ProviderFormValues = {
    id: p.id,
    name: p.name,
    provider: p.provider,
    model: p.model,
    baseUrl: p.baseUrl ?? "",
    isActive: p.isActive,
    hasKey: Boolean(p.apiKey),
  };

  return (
    <div>
      <Link href="/admin/ia" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a IA
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {p.name}</h1>
      <div className="mt-8">
        <ProviderForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar proveedor</h2>
        <p className="mt-1 text-sm text-brand-muted">Se borrará su configuración y su API key. No se puede deshacer.</p>
        <form action={deleteAiProvider} className="mt-3">
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton confirmMessage="¿Eliminar este proveedor de IA?" className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
