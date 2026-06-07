import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Colaboradores · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function CollaboratorsPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const items = await prisma.collaborator.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Colaboradores</h1>
        <Link
          href="/admin/colaboradores/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo colaborador
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="link" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay colaboradores. Crea el primero para mostrarlo en la web.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/colaboradores/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logoUrl} alt="" className="h-10 w-16 shrink-0 rounded border border-brand-border bg-white object-contain p-1" />
                  ) : (
                    <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded border border-brand-border text-brand-muted">
                      <Icon name="link" className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white">{c.name}</p>
                    {c.url && <p className="truncate text-sm text-brand-muted">{c.url}</p>}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    c.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                  )}
                >
                  {c.isActive ? "Activo" : "Oculto"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
