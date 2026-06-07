import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { pageRequireRole } from "@/server/auth/guards";
import { Role, type BookingStatus } from "@/generated/prisma/enums";
import { StatusBadge, BOOKING_STATUS } from "@/components/admin/status-badge";
import { ListControls } from "@/components/admin/list-controls";
import { Pagination } from "@/components/admin/pagination";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservas · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 20;
const STATUSES = Object.entries(BOOKING_STATUS).map(([value, { label }]) => ({ value, label }));
const VALID = new Set(Object.keys(BOOKING_STATUS));

export default async function ReservasPage({
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
    ...(status ? { status: status as BookingStatus } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { packName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [bookings, total, pending] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { status: "PENDING" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/reservas?${qs}` : "/admin/reservas";
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Reservas</h1>
        {pending > 0 && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-300">{pending} pendientes</span>
        )}
      </div>

      <ListControls chips={STATUSES} placeholder="Buscar por cliente, email o pack…" />

      {bookings.length === 0 ? (
        <EmptyState filtered={Boolean(q || status)} />
      ) : (
        <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {bookings.map((b) => {
            const st = BOOKING_STATUS[b.status] ?? { tone: "neutral" as const, label: b.status };
            return (
              <li key={b.id}>
                <Link
                  href={`/admin/reservas/${b.id}`}
                  className="flex flex-col gap-1 px-4 py-4 transition hover:bg-brand-surface-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {b.name} · <span className="text-brand-muted">{b.packName}</span>
                    </p>
                    <p className="truncate text-sm text-brand-muted">
                      {b.email}
                      {b.eventDate ? ` · ${b.eventDate.toLocaleDateString("es-ES")}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold text-white">{formatCents(b.total)}</span>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
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
      <Icon name="calendar-check" className="mx-auto h-8 w-8 text-brand-muted/50" />
      <p className="mt-2 text-brand-muted">
        {filtered ? "Ninguna reserva coincide con el filtro." : "Aún no hay reservas."}
      </p>
    </div>
  );
}
