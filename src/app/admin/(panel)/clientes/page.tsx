import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ListControls } from "@/components/admin/list-controls";
import { Pagination } from "@/components/admin/pagination";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clientes · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 30;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pro?: string; page?: string }>;
}) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const proOnly = sp.pro === "1";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(proOnly ? { isProfessional: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (proOnly) params.set("pro", "1");
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/clientes?${qs}` : "/admin/clientes";
  };

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

      <ListControls chips={[{ value: "1", label: "Profesionales" }]} filterParam="pro" placeholder="Buscar por nombre o email…" />

      {customers.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="users" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">
            {q || proOnly
              ? "Ningún cliente coincide con el filtro."
              : "Aún no hay clientes. Se crean automáticamente al recibir reservas."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {customers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
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

      <Pagination page={page} totalPages={totalPages} total={total} makeHref={makeHref} />
    </div>
  );
}
