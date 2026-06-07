import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = {
  title: "Extras · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function ExtrasPage() {
  const extras = await prisma.extra.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Extras</h1>
        <Link
          href="/admin/extras/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo extra
        </Link>
      </div>

      {extras.length === 0 ? (
        <p className="mt-8 text-brand-muted">Aún no hay extras.</p>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {extras.map((e) => (
            <li key={e.id}>
              <Link
                href={`/admin/extras/${e.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{e.name}</p>
                  <p className="truncate text-sm text-brand-muted">/{e.slug}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-white">{formatCents(e.price)}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      e.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                    )}
                  >
                    {e.isActive ? "Activo" : "Oculto"}
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
