import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { packImage } from "@/lib/pack-image";

export const metadata: Metadata = {
  title: "Packs · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function PacksPage() {
  const packs = await prisma.pack.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Packs</h1>
        <Link
          href="/admin/packs/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo pack
        </Link>
      </div>

      {packs.length === 0 ? (
        <p className="mt-8 text-brand-muted">Aún no hay packs.</p>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {packs.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/packs/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={packImage(p)}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded-md border border-brand-border object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {p.name}
                      {p.isPerDay && <span className="ml-2 text-xs text-brand-muted">/día</span>}
                    </p>
                    <p className="truncate text-sm text-brand-muted">/{p.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-white">{formatCents(p.basePrice)}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      p.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                    )}
                  >
                    {p.isActive ? "Activo" : "Oculto"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
