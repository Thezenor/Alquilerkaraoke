import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { CityForm, type CityFormValues } from "../city-form";
import { deleteCity } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: "Editar ciudad · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const { id } = await params;
  const c = await prisma.city.findUnique({ where: { id } });
  if (!c) notFound();

  const values: CityFormValues = {
    id: c.id,
    name: c.name,
    slug: c.slug,
    province: c.province,
    region: c.region,
    nearby: c.nearby.join("\n"),
    sortOrder: String(c.sortOrder),
    isActive: c.isActive,
    population: c.population != null ? String(c.population) : "",
    intro: c.intro ?? "",
    body: c.body ?? "",
    metaTitle: c.metaTitle ?? "",
    metaDescription: c.metaDescription ?? "",
  };

  return (
    <div>
      <Link href="/admin/ciudades" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a ciudades
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Editar: {c.name}</h1>
        <a
          href={`/es/karaoke/${c.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm text-brand-neon underline-offset-2 hover:underline"
        >
          Ver en la web ↗
        </a>
      </div>
      <div className="mt-8">
        <CityForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar ciudad</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer. La landing dejará de existir.</p>
        <form action={deleteCity} className="mt-3">
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar esta ciudad y su landing?"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
