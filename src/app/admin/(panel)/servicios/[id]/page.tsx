import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ServiceForm, type ServiceFormValues } from "../service-form";
import { deleteService } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar servicio · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

type Tr = { name?: string; shortDescription?: string; description?: string };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const [s, packs] = await Promise.all([
    prisma.service.findUnique({ where: { id } }),
    prisma.pack.findMany({ where: { category: { not: null } }, select: { category: true } }),
  ]);
  if (!s) notFound();
  const categories = [...new Set(packs.map((p) => p.category!).filter(Boolean))].sort();
  const tr = (s.translations ?? {}) as Record<string, Tr>;

  const values: ServiceFormValues = {
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category ?? "",
    shortDescription: s.shortDescription ?? "",
    description: s.description ?? "",
    heroImageUrl: s.heroImageUrl ?? "",
    metaTitle: s.metaTitle ?? "",
    metaDescription: s.metaDescription ?? "",
    sortOrder: String(s.sortOrder),
    isActive: s.isActive,
    name_en: tr.en?.name ?? "",
    short_en: tr.en?.shortDescription ?? "",
    desc_en: tr.en?.description ?? "",
    name_fr: tr.fr?.name ?? "",
    short_fr: tr.fr?.shortDescription ?? "",
    desc_fr: tr.fr?.description ?? "",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/servicios" className="text-sm text-brand-muted transition hover:text-white">
          ← Volver a servicios
        </Link>
        {s.isActive && (
          <a href={`/es/servicios/${s.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-neon underline">
            Ver en la web ↗
          </a>
        )}
      </div>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {s.name}</h1>
      <div className="mt-8">
        <ServiceForm values={values} categories={categories} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar servicio</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer.</p>
        <form action={deleteService} className="mt-3">
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar este servicio?"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
