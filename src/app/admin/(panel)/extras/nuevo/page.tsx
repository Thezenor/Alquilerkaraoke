import type { Metadata } from "next";
import Link from "next/link";
import { ExtraForm, type ExtraFormValues } from "../extra-form";

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
  isActive: true,
  sortOrder: "0",
  name_en: "",
  desc_en: "",
  name_fr: "",
  desc_fr: "",
};

export default function NewExtraPage() {
  return (
    <div>
      <Link href="/admin/extras" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a extras
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo extra</h1>
      <div className="mt-8">
        <ExtraForm values={empty} />
      </div>
    </div>
  );
}
