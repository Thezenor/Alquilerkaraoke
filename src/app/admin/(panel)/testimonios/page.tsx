import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testimonios · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const LOCALE_LABELS: Record<string, string> = { es: "ES", en: "EN", fr: "FR" };

export default async function TestimonialsPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const items = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Testimonios</h1>
        <Link
          href="/admin/testimonios/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo testimonio
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="star" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">
            Aún no hay testimonios. Crea el primero para mostrar prueba social en la web.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {items.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/testimonios/${t.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {t.authorName}
                    {t.eventType && <span className="ml-2 text-sm font-normal text-brand-muted">· {t.eventType}</span>}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-brand-muted">“{t.quote}”</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="text-brand-neon" aria-label={`${t.rating} de 5`}>
                    {"★".repeat(t.rating)}
                    <span className="text-brand-muted/40">{"★".repeat(5 - t.rating)}</span>
                  </span>
                  <span className="rounded-full bg-brand-surface-2 px-2 py-0.5 text-xs font-medium text-brand-muted">
                    {LOCALE_LABELS[t.locale] ?? t.locale.toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      t.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                    )}
                  >
                    {t.isActive ? "Activo" : "Oculto"}
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
