import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicios · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function AdminServicesPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const services = await prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Servicios</h1>
        <Link
          href="/admin/servicios/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo servicio
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="sparkles" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay servicios. Crea el primero para el menú y las páginas SEO.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {services.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/servicios/${s.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="truncate text-sm text-brand-muted">
                    /{s.slug}
                    {s.category ? ` · packs de "${s.category}"` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    s.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                  )}
                >
                  {s.isActive ? "Activo" : "Oculto"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
