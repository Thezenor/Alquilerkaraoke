import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASSES } from "./status";

export const metadata: Metadata = {
  title: "Reservas · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function ReservasPage() {
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const pending = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Reservas</h1>
        {pending > 0 && (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-300">
            {pending} pendientes
          </span>
        )}
      </div>

      {bookings.length === 0 ? (
        <p className="mt-8 text-brand-muted">Aún no hay reservas.</p>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {bookings.map((b) => (
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
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      BOOKING_STATUS_CLASSES[b.status],
                    )}
                  >
                    {BOOKING_STATUS_LABELS[b.status]}
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
