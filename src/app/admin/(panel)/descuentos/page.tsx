import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Descuentos · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function DiscountsPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Descuentos</h1>
        <Link
          href="/admin/descuentos/nuevo"
          className="rounded-full bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
        >
          Nuevo código
        </Link>
      </div>

      {codes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Icon name="ticket" className="mx-auto h-8 w-8 text-brand-muted/50" />
          <p className="mt-2 text-brand-muted">Aún no hay códigos de descuento.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          {codes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/descuentos/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-brand-surface-2"
              >
                <div className="min-w-0">
                  <p className="font-mono font-medium text-white">{c.code}</p>
                  <p className="truncate text-sm text-brand-muted">
                    {c.valueType === "PERCENT" ? `${c.value}%` : formatCents(c.value)} de descuento
                    {" · "}
                    {c.usedCount} {c.maxUses != null ? `/ ${c.maxUses}` : ""} usos
                    {c.validUntil ? ` · hasta ${c.validUntil.toLocaleDateString("es-ES")}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    c.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300",
                  )}
                >
                  {c.isActive ? "Activo" : "Inactivo"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
