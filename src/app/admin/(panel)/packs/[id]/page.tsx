import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { PackForm, type PackFormValues } from "../pack-form";
import { deletePack } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: "Editar pack · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

type Tr = { name?: string; shortDescription?: string; description?: string };

export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = await prisma.pack.findUnique({ where: { id } });
  if (!pack) notFound();

  const tr = (pack.translations ?? {}) as Record<string, Tr>;
  const en = tr.en ?? {};
  const fr = tr.fr ?? {};

  const values: PackFormValues = {
    id: pack.id,
    name: pack.name,
    slug: pack.slug,
    shortDescription: pack.shortDescription ?? "",
    description: pack.description ?? "",
    category: pack.category ?? "",
    imageUrl: pack.imageUrl ?? "",
    imageAlt: pack.imageAlt ?? "",
    basePrice: centsToInput(pack.basePrice),
    includedHours: String(pack.includedHours),
    extraHourPrice: centsToInput(pack.extraHourPrice),
    isPerDay: pack.isPerDay,
    depositType: pack.depositType,
    depositValue: pack.depositType === "PERCENT" ? String(pack.depositValue) : centsToInput(pack.depositValue),
    securityDeposit: centsToInput(pack.securityDeposit),
    isActive: pack.isActive,
    isFeatured: pack.isFeatured,
    sortOrder: String(pack.sortOrder),
    name_en: en.name ?? "",
    short_en: en.shortDescription ?? "",
    desc_en: en.description ?? "",
    name_fr: fr.name ?? "",
    short_fr: fr.shortDescription ?? "",
    desc_fr: fr.description ?? "",
  };

  return (
    <div>
      <Link href="/admin/packs" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a packs
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {pack.name}</h1>
      <div className="mt-8">
        <PackForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar pack</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Se borrará este pack del catálogo. Las reservas existentes conservan su copia (nombre e importe).
          Si solo quieres ocultarlo de la web, desmárcalo como activo. <strong className="text-brand-text">No se puede deshacer.</strong>
        </p>
        <form action={deletePack} className="mt-3">
          <input type="hidden" name="id" value={pack.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar este pack? No se puede deshacer."
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar pack
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
