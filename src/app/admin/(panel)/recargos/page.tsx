import type { Metadata } from "next";
import Link from "next/link";

import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { Icon } from "@/components/admin/icons";
import { StatusBadge } from "@/components/admin/status-badge";
import { toDateKey } from "@/server/calendar";
import { deleteSurcharge, toggleSurcharge, deleteBlock } from "../calendario/actions";
import { RecurringForm } from "./recurring-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recargos y fechas · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const TYPE_LABELS: Record<string, string> = {
  WEEKEND: "Fin de semana",
  NIGHT: "Nocturnidad",
  SPECIAL_DATE: "Fecha especial",
  HIGH_DEMAND: "Alta demanda",
  EXTERIOR: "Exterior",
  DIFFICULT_SETUP: "Montaje difícil",
  EVENT_TYPE: "Tipo de evento",
  OTHER: "Otro",
};

const RECURRING = new Set(["WEEKEND", "NIGHT"]);

type Cfg = { mode?: string; date?: string; from?: string; to?: string; weekdays?: number[] };

function describeConfig(type: string, config: unknown): string {
  if (RECURRING.has(type)) return type === "WEEKEND" ? "Sábados y domingos" : "Eventos nocturnos";
  const c = (config ?? {}) as Cfg;
  if (c.mode === "single" && c.date) return `El ${c.date}`;
  if (c.mode === "range" && c.from && c.to) return `Del ${c.from} al ${c.to}`;
  if (c.mode === "weekday" && c.weekdays?.length) return `Días de la semana: ${c.weekdays.join(", ")}`;
  return "Sin condición definida";
}

export default async function RecargosPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);

  const now = new Date();
  const [surcharges, blocks] = await Promise.all([
    prisma.surcharge.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.dateBlock.findMany({ where: { OR: [{ date: { gte: now } }, { endDate: { gte: now } }] }, orderBy: { date: "asc" } }),
  ]);

  const recurring = surcharges.filter((s) => RECURRING.has(s.type));
  const dateBased = surcharges.filter((s) => !RECURRING.has(s.type));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Recargos y fechas</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Suplementos aplicados automáticamente al calcular presupuestos.
          </p>
        </div>
        <Link
          href="/admin/calendario"
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-muted transition hover:border-brand-neon hover:text-brand-neon"
        >
          <Icon name="calendar" className="h-4 w-4" />
          Ir al calendario
        </Link>
      </div>

      {/* Crear recargo recurrente */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Nuevo recargo recurrente</h2>
        <RecurringForm />
      </section>

      {/* Recurrentes */}
      <SurchargeTable
        title="Recargos recurrentes"
        empty="No hay recargos recurrentes. Crea uno arriba."
        rows={recurring}
        describe={describeConfig}
        typeLabels={TYPE_LABELS}
      />

      {/* Por fecha */}
      <SurchargeTable
        title="Recargos por fecha"
        empty="No hay recargos por fecha. Créalos desde el calendario."
        rows={dateBased}
        describe={describeConfig}
        typeLabels={TYPE_LABELS}
      />

      {/* Bloqueos vigentes */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Fechas bloqueadas (próximas)</h2>
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-brand-muted">
            No hay fechas bloqueadas próximas.
          </p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((b) => {
              const start = toDateKey(b.date);
              const end = b.endDate ? toDateKey(b.endDate) : null;
              return (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5"
                >
                  <span className="inline-flex items-center gap-2 text-sm text-red-200">
                    <Icon name="ban" className="h-4 w-4 text-red-400" />
                    {end && end !== start ? `${start} → ${end}` : start}
                    {b.reason && <span className="text-brand-muted">· {b.reason}</span>}
                  </span>
                  <form action={deleteBlock}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      aria-label="Desbloquear fecha"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted transition hover:bg-red-500/15 hover:text-red-300"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SurchargeTable({
  title,
  empty,
  rows,
  describe,
  typeLabels,
}: {
  title: string;
  empty: string;
  rows: { id: string; name: string; type: string; valueType: string; value: number; isActive: boolean; config: unknown }[];
  describe: (type: string, config: unknown) => string;
  typeLabels: Record<string, string>;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-brand-muted">
          {empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-border">
          <ul className="divide-y divide-brand-border">
            {rows.map((s) => (
              <li key={s.id} className="flex items-center gap-3 bg-brand-surface px-3 py-3 sm:px-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">{s.name}</span>
                    <span className="rounded bg-brand-surface-2 px-1.5 py-0.5 text-[11px] text-brand-muted">
                      {typeLabels[s.type] ?? s.type}
                    </span>
                    {!s.isActive && <StatusBadge tone="neutral">Inactivo</StatusBadge>}
                  </div>
                  <p className="mt-0.5 text-xs text-brand-muted">{describe(s.type, s.config)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-300">
                  {s.valueType === "PERCENT" ? `+${s.value}%` : `+${formatCents(s.value)}`}
                </span>
                <form action={toggleSurcharge}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="isActive" value={String(s.isActive)} />
                  <button
                    type="submit"
                    className="rounded-lg border border-brand-border px-2.5 py-1 text-xs text-brand-muted transition hover:border-brand-neon hover:text-brand-neon"
                  >
                    {s.isActive ? "Desactivar" : "Activar"}
                  </button>
                </form>
                <form action={deleteSurcharge}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    aria-label="Eliminar recargo"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted transition hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
