import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ciudades · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function CitiesPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const cities = await prisma.city.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Ciudades</h1>
          <p className="mt-1 text-sm text-brand-muted">Landings SEO locales (/karaoke/ciudad). Cada una genera su página y entra en el sitemap.</p>
        </div>
        <Link
          href="/admin/ciudades/nueva"
          className="shrink-0 rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nueva ciudad
        </Link>
      </div>

      {cities.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="map-pin" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay ciudades.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {cities.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/ciudades/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="truncate text-sm text-brand-muted">
                    {c.province} · {c.region}
                    {c.nearby.length > 0 ? ` · ${c.nearby.length} poblaciones` : ""}
                    {" · /karaoke/"}
                    {c.slug}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    c.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                  )}
                >
                  {c.isActive ? "Activa" : "Inactiva"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
