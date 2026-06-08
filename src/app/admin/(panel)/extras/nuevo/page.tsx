import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExtraForm, type ExtraFormValues } from "../extra-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo extra · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: ExtraFormValues = {
  name: "",
  slug: "",
  description: "",
  category: "",
  price: "",
  appliesToCategories: [],
  isActive: true,
  sortOrder: "0",
  name_en: "",
  desc_en: "",
  name_fr: "",
  desc_fr: "",
};

async function packCategories(): Promise<string[]> {
  const packs = await prisma.pack.findMany({ where: { category: { not: null } }, select: { category: true } });
  return [...new Set(packs.map((p) => p.category!).filter(Boolean))].sort();
}

export default async function NewExtraPage() {
  const categories = await packCategories();
  return (
    <div>
      <Link href="/admin/extras" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a extras
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo extra</h1>
      <div className="mt-8">
        <ExtraForm values={empty} categories={categories} />
      </div>
    </div>
  );
}
