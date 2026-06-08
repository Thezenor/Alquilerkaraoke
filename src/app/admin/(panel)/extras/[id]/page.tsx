import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { ExtraForm, type ExtraFormValues } from "../extra-form";

export const metadata: Metadata = {
  title: "Editar extra · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

type Tr = { name?: string; description?: string };

export const dynamic = "force-dynamic";

export default async function EditExtraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [extra, packs] = await Promise.all([
    prisma.extra.findUnique({ where: { id } }),
    prisma.pack.findMany({ where: { category: { not: null } }, select: { category: true } }),
  ]);
  if (!extra) notFound();
  const categories = [...new Set(packs.map((p) => p.category!).filter(Boolean))].sort();

  const tr = (extra.translations ?? {}) as Record<string, Tr>;
  const en = tr.en ?? {};
  const fr = tr.fr ?? {};

  const values: ExtraFormValues = {
    id: extra.id,
    name: extra.name,
    slug: extra.slug,
    description: extra.description ?? "",
    category: extra.category ?? "",
    price: centsToInput(extra.price),
    appliesToCategories: extra.appliesToCategories,
    isActive: extra.isActive,
    sortOrder: String(extra.sortOrder),
    name_en: en.name ?? "",
    desc_en: en.description ?? "",
    name_fr: fr.name ?? "",
    desc_fr: fr.description ?? "",
  };

  return (
    <div>
      <Link href="/admin/extras" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a extras
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {extra.name}</h1>
      <div className="mt-8">
        <ExtraForm values={values} categories={categories} />
      </div>
    </div>
  );
}
