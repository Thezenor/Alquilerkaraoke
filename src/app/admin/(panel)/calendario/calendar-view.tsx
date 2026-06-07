"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/admin/icons";
import { StatusBadge, BOOKING_STATUS } from "@/components/admin/status-badge";
import { formatCents } from "@/lib/money";
import {
  createDateSurcharge,
  createBlock,
  deleteSurcharge,
  deleteBlock,
  type CalendarActionState,
} from "./actions";

export type DayCell = {
  dateKey: string;
  day: number;
  inMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  bookings: { id: string; packName: string; name: string; total: number; status: string; night: boolean }[];
  surcharges: { id: string; name: string; type: string; isActive: boolean; valueLabel: string }[];
  block: { id: string; reason: string | null; isRange: boolean } | null;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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

function formatDateLong(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function CalendarView({
  weeks,
  monthLabel,
  prevHref,
  nextHref,
  todayHref,
}: {
  weeks: DayCell[][];
  monthLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = selectedKey
    ? weeks.flat().find((c) => c.dateKey === selectedKey) ?? null
    : null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Calendario</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Reservas, fechas con recargo y bloqueos de disponibilidad.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={prevHref}
            aria-label="Mes anterior"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-muted transition hover:border-brand-neon hover:text-brand-neon"
          >
            <Icon name="chevron-left" className="h-5 w-5" />
          </Link>
          <span className="min-w-[160px] text-center text-base font-semibold text-white capitalize">
            {monthLabel}
          </span>
          <Link
            href={nextHref}
            aria-label="Mes siguiente"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-muted transition hover:border-brand-neon hover:text-brand-neon"
          >
            <Icon name="chevron-right" className="h-5 w-5" />
          </Link>
          <Link
            href={todayHref}
            className="ml-1 rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-muted transition hover:border-brand-neon hover:text-brand-neon"
          >
            Hoy
          </Link>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6">
        {/* Rejilla del mes */}
        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-brand-border bg-brand-border">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-brand-surface py-2 text-center text-[11px] font-semibold tracking-wide text-brand-muted uppercase"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
            {weeks.flat().map((cell) => (
              <DayButton
                key={cell.dateKey}
                cell={cell}
                selected={cell.dateKey === selectedKey}
                onSelect={() => setSelectedKey(cell.dateKey)}
              />
            ))}
          </div>
          <Legend />
        </div>

        {/* Panel del día — columna lateral en escritorio */}
        <aside className="hidden lg:block">
          {selected ? (
            <DayPanel key={selected.dateKey} cell={selected} onClose={() => setSelectedKey(null)} />
          ) : (
            <div className="rounded-xl border border-dashed border-brand-border p-6 text-center text-sm text-brand-muted">
              Selecciona un día para ver reservas, añadir un recargo o bloquear la fecha.
            </div>
          )}
        </aside>
      </div>

      {/* Panel del día — hoja inferior en móvil */}
      {selected && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedKey(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-brand-border bg-brand-surface p-4 shadow-2xl">
            <DayPanel key={selected.dateKey} cell={selected} onClose={() => setSelectedKey(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function DayButton({
  cell,
  selected,
  onSelect,
}: {
  cell: DayCell;
  selected: boolean;
  onSelect: () => void;
}) {
  const blocked = cell.block !== null;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-[68px] flex-col gap-1 p-1.5 text-left transition sm:min-h-[96px] sm:p-2",
        cell.inMonth ? "bg-brand-surface hover:bg-brand-surface-2/70" : "bg-brand-surface/40",
        blocked && "bg-red-500/5",
        selected && "ring-2 ring-brand-neon ring-inset",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
            cell.isToday && "bg-brand-neon font-bold text-black",
            !cell.isToday && cell.inMonth && "text-white",
            !cell.isToday && !cell.inMonth && "text-brand-muted/50",
            !cell.isToday && cell.isWeekend && cell.inMonth && "text-brand-neon/90",
          )}
        >
          {cell.day}
        </span>
        {blocked && <Icon name="ban" className="h-3.5 w-3.5 text-red-400" />}
      </div>

      {/* Marcadores compactos */}
      <div className="flex flex-1 flex-col gap-0.5">
        {cell.surcharges.length > 0 && (
          <span className="hidden truncate rounded bg-amber-500/15 px-1 py-0.5 text-[10px] font-medium text-amber-300 sm:inline-block">
            {cell.surcharges[0].valueLabel}
            {cell.surcharges.length > 1 && ` +${cell.surcharges.length - 1}`}
          </span>
        )}
        {cell.bookings.length > 0 && (
          <span className="hidden truncate rounded bg-brand-neon/15 px-1 py-0.5 text-[10px] font-medium text-brand-neon sm:inline-block">
            {cell.bookings.length} {cell.bookings.length === 1 ? "reserva" : "reservas"}
          </span>
        )}
      </div>

      {/* Puntos (móvil) */}
      <div className="flex items-center gap-1 sm:hidden">
        {cell.surcharges.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
        {cell.bookings.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-brand-neon" />}
      </div>
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-brand-neon" /> Reserva
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400" /> Recargo
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="ban" className="h-3.5 w-3.5 text-red-400" /> Bloqueada
      </span>
    </div>
  );
}

function DayPanel({ cell, onClose }: { cell: DayCell; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-white capitalize">{formatDateLong(cell.dateKey)}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-surface-2 hover:text-white"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      {/* Reservas del día */}
      <section className="mt-4">
        <h3 className="text-xs font-semibold tracking-wide text-brand-muted uppercase">Reservas</h3>
        {cell.bookings.length === 0 ? (
          <p className="mt-1 text-sm text-brand-muted/70">Sin reservas este día.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {cell.bookings.map((b) => {
              const st = BOOKING_STATUS[b.status] ?? { tone: "neutral" as const, label: b.status };
              return (
                <li key={b.id} className="rounded-lg border border-brand-border bg-brand-surface-2/40 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">{b.packName}</span>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-brand-muted">
                    <span className="inline-flex items-center gap-1 truncate">
                      {b.name}
                      {b.night && <Icon name="moon" className="h-3 w-3 text-indigo-300" />}
                    </span>
                    <span className="font-medium text-brand-muted">{formatCents(b.total)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recargos que aplican */}
      <section className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-brand-muted uppercase">Recargos en esta fecha</h3>
        {cell.surcharges.length === 0 ? (
          <p className="mt-1 text-sm text-brand-muted/70">Ningún recargo aplica.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {cell.surcharges.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">{s.name}</span>
                  <span className="text-[11px] text-brand-muted">{TYPE_LABELS[s.type] ?? s.type}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-amber-300">{s.valueLabel}</span>
                  <DeleteButton action={deleteSurcharge} id={s.id} label="Eliminar recargo" />
                </span>
              </li>
            ))}
          </ul>
        )}
        <SurchargeForm dateKey={cell.dateKey} />
      </section>

      {/* Bloqueo de disponibilidad */}
      <section className="mt-5">
        <h3 className="text-xs font-semibold tracking-wide text-brand-muted uppercase">Disponibilidad</h3>
        {cell.block ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-2.5 py-2">
            <span className="inline-flex items-center gap-2 text-sm text-red-200">
              <Icon name="ban" className="h-4 w-4 text-red-400" />
              {cell.block.reason || "Fecha bloqueada"}
              {cell.block.isRange && <span className="text-[11px] text-brand-muted">(rango)</span>}
            </span>
            <DeleteButton action={deleteBlock} id={cell.block.id} label="Desbloquear" />
          </div>
        ) : (
          <BlockForm dateKey={cell.dateKey} />
        )}
      </section>
    </div>
  );
}

function DeleteButton({
  action,
  id,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-brand-muted transition hover:bg-red-500/15 hover:text-red-300"
      >
        <Icon name="trash" className="h-4 w-4" />
      </button>
    </form>
  );
}

const INITIAL: CalendarActionState = { ok: false };

function SurchargeForm({ dateKey }: { dateKey: string }) {
  const [state, formAction, pending] = useActionState(createDateSurcharge, INITIAL);
  const [range, setRange] = useState(false);

  return (
    <details className="mt-3 rounded-lg border border-brand-border">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-brand-muted hover:text-white">
        <Icon name="plus" className="h-4 w-4" />
        Añadir recargo en esta fecha
      </summary>
      <form action={formAction} className="space-y-2.5 border-t border-brand-border p-3">
        <input type="hidden" name="date" value={dateKey} />
        <input type="hidden" name="mode" value={range ? "range" : "single"} />

        <Field label="Nombre">
          <input name="name" required maxLength={120} placeholder="Ej. Nochevieja" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Tipo">
            <select name="type" defaultValue="SPECIAL_DATE" className={inputCls}>
              <option value="SPECIAL_DATE">Fecha especial</option>
              <option value="HIGH_DEMAND">Alta demanda</option>
              <option value="OTHER">Otro</option>
            </select>
          </Field>
          <Field label="Modificador">
            <select name="valueType" defaultValue="PERCENT" className={inputCls}>
              <option value="PERCENT">Porcentaje (%)</option>
              <option value="FIXED">Cantidad fija (€)</option>
            </select>
          </Field>
        </div>

        <Field label="Valor">
          <input name="value" required inputMode="decimal" placeholder="15" className={inputCls} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-brand-muted">
          <input
            type="checkbox"
            checked={range}
            onChange={(e) => setRange(e.target.checked)}
            className="h-4 w-4 rounded border-brand-border bg-brand-surface-2 accent-brand-neon"
          />
          Aplicar a un rango de fechas
        </label>
        {range && (
          <Field label="Hasta">
            <input type="date" name="to" min={dateKey} className={inputCls} />
          </Field>
        )}

        {state.message && (
          <p className={cn("text-xs", state.ok ? "text-emerald-400" : "text-red-400")}>{state.message}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-brand-neon px-3 py-2 text-sm font-semibold text-black transition hover:bg-brand-neon/90 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Crear recargo"}
        </button>
      </form>
    </details>
  );
}

function BlockForm({ dateKey }: { dateKey: string }) {
  const [state, formAction, pending] = useActionState(createBlock, INITIAL);
  const [range, setRange] = useState(false);

  return (
    <form action={formAction} className="mt-2 space-y-2.5 rounded-lg border border-brand-border p-3">
      <input type="hidden" name="date" value={dateKey} />
      <Field label="Motivo (opcional)">
        <input name="reason" maxLength={200} placeholder="Ej. Mantenimiento de equipo" className={inputCls} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-brand-muted">
        <input
          type="checkbox"
          checked={range}
          onChange={(e) => setRange(e.target.checked)}
          className="h-4 w-4 rounded border-brand-border bg-brand-surface-2 accent-brand-neon"
        />
        Bloquear un rango de fechas
      </label>
      {range && (
        <Field label="Hasta">
          <input type="date" name="endDate" min={dateKey} className={inputCls} />
        </Field>
      )}
      {state.message && (
        <p className={cn("text-xs", state.ok ? "text-emerald-400" : "text-red-400")}>{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        <Icon name="ban" className="h-4 w-4" />
        {pending ? "Bloqueando…" : "Bloquear fecha"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-brand-border bg-brand-surface-2 px-2.5 py-1.5 text-sm text-white placeholder:text-brand-muted/60 focus:border-brand-neon focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-brand-muted">{label}</span>
      {children}
    </label>
  );
}
