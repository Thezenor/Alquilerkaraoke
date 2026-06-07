import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role, type ContactStatus } from "@/generated/prisma/enums";
import { StatusBadge, CONTACT_STATUS } from "@/components/admin/status-badge";
import { ListControls } from "@/components/admin/list-controls";
import { Pagination } from "@/components/admin/pagination";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Solicitudes · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;
const STATUSES = Object.entries(CONTACT_STATUS).map(([value, { label }]) => ({ value, label }));
const VALID = new Set(Object.keys(CONTACT_STATUS));

export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status && VALID.has(sp.status) ? sp.status : "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(status ? { status: status as ContactStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total, newCount] = await Promise.all([
    prisma.contactRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.contactRequest.count({ where }),
    prisma.contactRequest.count({ where: { status: "NEW" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/solicitudes?${qs}` : "/admin/solicitudes";
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Solicitudes de contacto</h1>
        {newCount > 0 && (
          <span className="rounded-full bg-brand-neon/15 px-3 py-1 text-sm text-brand-neon">{newCount} nuevas</span>
        )}
      </div>

      <ListControls chips={STATUSES} placeholder="Buscar por nombre, email o ciudad…" />

      {items.length === 0 ? (
        <EmptyState filtered={Boolean(q || status)} />
      ) : (
        <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {items.map((item) => {
            const st = CONTACT_STATUS[item.status] ?? { tone: "neutral" as const, label: item.status };
            return (
              <li key={item.id}>
                <Link
                  href={`/admin/solicitudes/${item.id}`}
                  className="flex flex-col gap-1 px-4 py-4 transition hover:bg-brand-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="truncate text-sm text-brand-muted">
                      {item.email}
                      {item.city ? ` · ${item.city}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    <time className="text-brand-muted" dateTime={item.createdAt.toISOString()}>
                      {item.createdAt.toLocaleDateString("es-ES")}
                    </time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} makeHref={makeHref} />
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-brand-border p-10 text-center">
      <Icon name="inbox" className="mx-auto h-8 w-8 text-brand-muted/50" />
      <p className="mt-2 text-brand-muted">
        {filtered ? "Ninguna solicitud coincide con el filtro." : "Aún no hay solicitudes."}
      </p>
    </div>
  );
}
