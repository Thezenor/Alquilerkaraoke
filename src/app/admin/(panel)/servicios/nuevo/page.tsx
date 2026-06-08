import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ServiceForm, type ServiceFormValues } from "../service-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo servicio · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: ServiceFormValues = {
  name: "", slug: "", category: "", shortDescription: "", description: "", heroImageUrl: "",
  metaTitle: "", metaDescription: "", sortOrder: "0", isActive: true,
  name_en: "", short_en: "", desc_en: "", name_fr: "", short_fr: "", desc_fr: "",
};

async function packCategories(): Promise<string[]> {
  const packs = await prisma.pack.findMany({ where: { category: { not: null } }, select: { category: true } });
  return [...new Set(packs.map((p) => p.category!).filter(Boolean))].sort();
}

export default async function NewServicePage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const categories = await packCategories();
  return (
    <div>
      <Link href="/admin/servicios" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a servicios
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo servicio</h1>
      <div className="mt-8">
        <ServiceForm values={empty} categories={categories} />
      </div>
    </div>
  );
}
