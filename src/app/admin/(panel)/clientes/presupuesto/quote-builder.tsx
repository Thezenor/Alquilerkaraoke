"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { eurosToCents, formatCents } from "@/lib/money";
import { createManualQuote, type QuoteState } from "./actions";

const initial: QuoteState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type PackOption = { id: string; name: string; description: string; priceInput: string; includedHours: number };
export type ProvinceOption = { name: string; supplement: number };
export type QuotePrefill = { name: string; email: string; phone: string };

type Line = { packId: string; name: string; description: string; price: string; hours: string };

const emptyLine = (): Line => ({ packId: "", name: "", description: "", price: "", hours: "" });

export function QuoteBuilder({
  packs,
  provinces,
  vatPercent,
  prefill,
}: {
  packs: PackOption[];
  provinces: ProvinceOption[];
  vatPercent: number;
  prefill: QuotePrefill;
}) {
  const [state, action, pending] = useActionState(createManualQuote, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [name, setName] = useState(prefill.name);
  const [email, setEmail] = useState(prefill.email);
  const [phone, setPhone] = useState(prefill.phone);
  const [date, setDate] = useState("");
  const [province, setProvince] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [attendees, setAttendees] = useState("");
  const [depositPercent, setDepositPercent] = useState("50");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const onPackSelect = (i: number, packId: string) => {
    const p = packs.find((x) => x.id === packId);
    if (!p) {
      setLine(i, { packId: "" });
      return;
    }
    setLine(i, {
      packId,
      name: p.name,
      description: p.description,
      price: p.priceInput,
      hours: String(p.includedHours || ""),
    });
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const supplement = useMemo(() => provinces.find((p) => p.name === province)?.supplement ?? 0, [provinces, province]);

  const totals = useMemo(() => {
    const linesCents = lines.reduce((s, l) => s + eurosToCents(l.price), 0);
    const subtotal = linesCents + supplement;
    const dep = Math.min(100, Math.max(0, parseInt(depositPercent, 10) || 0));
    const vat = Math.round((subtotal * vatPercent) / 100);
    const total = subtotal + vat;
    const deposit = Math.round((total * dep) / 100);
    return { subtotal, vat, total, deposit };
  }, [lines, supplement, vatPercent, depositPercent]);

  // Serializa las líneas para el server action.
  const linesJson = JSON.stringify(
    lines
      .filter((l) => l.name.trim())
      .map((l) => ({ name: l.name.trim(), description: l.description, price: l.price, hours: l.hours })),
  );

  // Previsualiza el PDF sin guardar nada: POST del formulario a /preview y abre el PDF.
  async function handlePreview() {
    setPreviewError(null);
    if (!lines.some((l) => l.name.trim() && eurosToCents(l.price) > 0)) {
      setPreviewError("Añade al menos un producto con su precio para previsualizar.");
      return;
    }
    // Abre la pestaña de forma síncrona (evita el bloqueo de popups tras el await).
    const win = window.open("", "_blank");
    setPreviewing(true);
    try {
      const res = await fetch("/admin/clientes/presupuesto/preview", { method: "POST", body: new FormData(formRef.current!) });
      if (!res.ok) {
        win?.close();
        setPreviewError((await res.text()) || "No se pudo generar la previsualización.");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      win?.close();
      setPreviewError("No se pudo generar la previsualización.");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <form ref={formRef} action={action} className="max-w-3xl">
      <input type="hidden" name="lines" value={linesJson} />

      {/* Evento */}
      <section className="rounded-2xl border border-brand-border bg-brand-surface p-5">
        <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">Evento</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Fecha del evento</span>
            <input type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Provincia</span>
            <select name="province" value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass}>
              <option value="">— Selecciona —</option>
              {provinces.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                  {p.supplement > 0 ? ` (+${formatCents(p.supplement)})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Hora (opcional)</span>
            <input name="eventTime" value={eventTime} onChange={(e) => setEventTime(e.target.value)} placeholder="20:00" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Asistentes (opcional)</span>
            <input name="attendees" type="number" min={0} value={attendees} onChange={(e) => setAttendees(e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      {/* Cliente */}
      <section className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">Cliente</h2>
        <p className="mt-1 text-xs text-brand-muted">
          El email y el teléfono dan de alta al cliente como usuario (el teléfono es su contraseña inicial).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 sm:col-span-3">
            <span className="text-sm font-medium text-brand-text">Nombre <span className="text-brand-neon">*</span></span>
            <input name="customerName" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-brand-text">Email <span className="text-brand-neon">*</span></span>
            <input name="customerEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Teléfono <span className="text-brand-neon">*</span></span>
            <input name="customerPhone" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      {/* Productos */}
      <section className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-brand-muted uppercase">Productos</h2>
          <button type="button" onClick={addLine} className="rounded-full border border-brand-neon/60 px-3 py-1.5 text-sm font-medium text-brand-neon transition hover:bg-brand-neon/10">
            + Añadir producto
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {lines.map((l, i) => (
            <div key={i} data-testid="quote-line" className="rounded-xl border border-brand-border bg-brand-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-brand-muted">Producto {i + 1}</span>
                {lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(i)} className="text-xs text-red-400 transition hover:text-red-300">
                    Quitar
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-12">
                <label className="flex flex-col gap-1.5 sm:col-span-5">
                  <span className="text-xs text-brand-muted">Plantilla (pack)</span>
                  <select value={l.packId} onChange={(e) => onPackSelect(i, e.target.value)} className={`${inputClass} text-sm`}>
                    <option value="">— Elegir del sistema —</option>
                    {packs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-5">
                  <span className="text-xs text-brand-muted">Nombre / título</span>
                  <input value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} className={`${inputClass} text-sm`} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs text-brand-muted">Horas</span>
                  <input value={l.hours} onChange={(e) => setLine(i, { hours: e.target.value })} placeholder="4" className={`${inputClass} text-sm`} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-9">
                  <span className="text-xs text-brand-muted">Qué incluye (una línea por punto)</span>
                  <textarea rows={4} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} className={`${inputClass} font-mono text-xs`} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-3">
                  <span className="text-xs text-brand-muted">Precio (€, sin IVA)</span>
                  <input value={l.price} onChange={(e) => setLine(i, { price: e.target.value })} inputMode="decimal" placeholder="750.00" className={`${inputClass} text-sm`} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Totales */}
      <section className="mt-5 rounded-2xl border border-brand-border bg-brand-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">% señal para reservar</span>
            <input name="depositPercent" type="number" min={0} max={100} value={depositPercent} onChange={(e) => setDepositPercent(e.target.value)} className={`${inputClass} w-28`} />
          </label>
          <div className="min-w-[220px] text-sm">
            <div className="flex justify-between py-1 text-brand-muted"><span>Subtotal (sin IVA)</span><span>{formatCents(totals.subtotal)}</span></div>
            <div className="flex justify-between py-1 text-brand-muted"><span>IVA ({vatPercent}%)</span><span>{formatCents(totals.vat)}</span></div>
            <div className="flex justify-between border-t border-brand-border py-1 font-semibold text-white"><span>Total</span><span>{formatCents(totals.total)}</span></div>
            <div className="flex justify-between py-1 text-brand-neon"><span>Señal</span><span>{formatCents(totals.deposit)}</span></div>
          </div>
        </div>
        {province && supplement > 0 && (
          <p className="mt-2 text-xs text-brand-muted">Incluye suplemento de provincia ({province}): {formatCents(supplement)}.</p>
        )}
      </section>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}
      {previewError && <p role="alert" className="mt-5 text-sm text-red-400">{previewError}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="rounded-full border border-brand-neon/60 px-5 py-2.5 text-sm font-semibold text-brand-neon transition hover:bg-brand-neon/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewing ? "Generando…" : "👁 Previsualizar PDF"}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar y generar presupuesto"}
        </button>
      </div>
    </form>
  );
}
