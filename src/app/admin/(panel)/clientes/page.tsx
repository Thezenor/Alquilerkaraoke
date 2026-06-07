import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Clientes · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function ClientesPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Clientes</h1>
        <Link
          href="/admin/clientes/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo cliente
        </Link>
      </div>

      {customers.length === 0 ? (
        <p className="mt-8 text-brand-muted">Aún no hay clientes. Se crean automáticamente al recibir reservas.</p>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {customers.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/clientes/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2">
                <div className="min-w-0">
                  <p className="font-medium text-white">{c.name || c.email}</p>
                  <p className="truncate text-sm text-brand-muted">{c.email}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {c.isProfessional && (
                    <span className="rounded-full bg-brand-neon/15 px-2.5 py-0.5 text-xs font-medium text-brand-neon">
                      Pro · {c.discountPercent}%
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
