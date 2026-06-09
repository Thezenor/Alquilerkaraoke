import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eventos · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function AdminEventsPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const events = await prisma.eventType.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Eventos</h1>
          <p className="mt-1 text-sm text-brand-muted">Páginas SEO por tipo de evento (/eventos). Cada una entra en el menú y el sitemap.</p>
        </div>
        <Link href="/admin/eventos/nuevo" className="shrink-0 rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
          Nuevo evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="gift" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay tipos de evento.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/eventos/${e.id}`} className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2">
                <div className="min-w-0">
                  <p className="font-medium text-white">{e.name}</p>
                  <p className="truncate text-sm text-brand-muted">{e.shortDescription || `/eventos/${e.slug}`}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", e.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300")}>
                  {e.isActive ? "Activo" : "Inactivo"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
