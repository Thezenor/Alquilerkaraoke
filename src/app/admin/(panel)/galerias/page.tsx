import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";
import { isExpired } from "@/server/galleries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerías · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function AdminGalleriesPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const galleries = await prisma.gallery.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Galerías</h1>
          <p className="mt-1 text-sm text-brand-muted">Fotos y vídeos por evento. Privadas por clave, con caducidad y descarga configurable.</p>
        </div>
        <Link href="/admin/galerias/nueva" className="shrink-0 rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
          Nueva galería
        </Link>
      </div>

      {galleries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="image" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay galerías.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {galleries.map((g) => {
            const expired = isExpired(g);
            return (
              <li key={g.id}>
                <Link href={`/admin/galerias/${g.id}`} className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{g.title}</p>
                    <p className="truncate text-sm text-brand-muted">
                      {g._count.items} elementos · /galerias/{g.slug}
                      {g.expiresAt ? ` · caduca ${g.expiresAt.toLocaleDateString("es-ES")}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {g.passwordHash && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Privada</span>}
                    {g.isListed && <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">Listada</span>}
                    {expired && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">Caducada</span>}
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", g.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300")}>
                      {g.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
