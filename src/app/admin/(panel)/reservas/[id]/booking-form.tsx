"use client";

import { useActionState } from "react";
import { updateBooking, type BookingState } from "../actions";
import { BOOKING_STATUS_OPTIONS, BOOKING_STATUS_LABELS } from "../status";

const initial: BookingState = { status: "idle" };

export function BookingForm({
  id,
  currentStatus,
  currentNote,
}: {
  id: string;
  currentStatus: string;
  currentNote: string;
}) {
  const [state, action, pending] = useActionState(updateBooking, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status" className="text-sm font-medium text-brand-text">Estado</label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none focus:border-brand-neon"
        >
          {BOOKING_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="adminNote" className="text-sm font-medium text-brand-text">Notas internas</label>
        <textarea
          id="adminNote"
          name="adminNote"
          rows={4}
          defaultValue={currentNote}
          className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
        />
      </div>

      {state.status !== "idle" && state.message && (
        <p role="status" className={state.status === "success" ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
