import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { STATUS_LABELS, STATUS_CLASSES } from "./status";

export const metadata: Metadata = {
  title: "Solicitudes · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function SolicitudesPage() {
  const items = await prisma.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const newCount = items.filter((i) => i.status === "NEW").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Solicitudes de contacto</h1>
        {newCount > 0 && (
          <span className="rounded-full bg-brand-neon/15 px-3 py-1 text-sm text-brand-neon">
            {newCount} nuevas
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-brand-muted">Aún no hay solicitudes.</p>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {items.map((item) => (
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
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_CLASSES[item.status],
                    )}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                  <time className="text-brand-muted" dateTime={item.createdAt.toISOString()}>
                    {item.createdAt.toLocaleDateString("es-ES")}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
