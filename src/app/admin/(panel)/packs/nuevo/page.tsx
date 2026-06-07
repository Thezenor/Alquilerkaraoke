import type { Metadata } from "next";
import Link from "next/link";
import { PackForm, type PackFormValues } from "../pack-form";

export const metadata: Metadata = {
  title: "Nuevo pack · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: PackFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "",
  basePrice: "",
  includedHours: "4",
  extraHourPrice: "",
  isPerDay: false,
  depositType: "PERCENT",
  depositValue: "30",
  securityDeposit: "",
  isActive: true,
  sortOrder: "0",
  name_en: "",
  short_en: "",
  desc_en: "",
  name_fr: "",
  short_fr: "",
  desc_fr: "",
};

export default function NewPackPage() {
  return (
    <div>
      <Link href="/admin/packs" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a packs
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo pack</h1>
      <div className="mt-8">
        <PackForm values={empty} />
      </div>
    </div>
  );
}
