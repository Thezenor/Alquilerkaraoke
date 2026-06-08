import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { CityForm, type CityFormValues } from "../city-form";

export const metadata: Metadata = {
  title: "Nueva ciudad · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: CityFormValues = {
  name: "",
  slug: "",
  province: "",
  region: "",
  nearby: "",
  sortOrder: "",
  isActive: true,
  population: "",
  intro: "",
  body: "",
  metaTitle: "",
  metaDescription: "",
};

export default async function NewCityPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  return (
    <div>
      <Link href="/admin/ciudades" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a ciudades
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nueva ciudad</h1>
      <div className="mt-8">
        <CityForm values={empty} />
      </div>
    </div>
  );
}
