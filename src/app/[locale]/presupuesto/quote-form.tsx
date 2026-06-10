"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Turnstile } from "@/components/turnstile";
import { quoteAction, type QuoteState } from "./actions";

const initial: QuoteState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type QuoteOptions = {
  packs: { id: string; name: string; category?: string | null }[];
  extras: { id: string; name: string; category?: string | null; appliesTo: string[] }[];
  provinces: string[];
};

export function QuoteForm({
  options,
  defaultPackId,
  defaultPackName,
  whatsappUrl,
  phone,
  phoneHref,
}: {
  options: QuoteOptions;
  defaultPackId?: string | null;
  defaultPackName?: string | null;
  whatsappUrl?: string;
  phone?: string;
  phoneHref?: string;
}) {
  const t = useTranslations("Quote");
  const locale = useLocale();
  const [state, action, pending] = useActionState(quoteAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [packId, setPackId] = useState(defaultPackId ?? options.packs[0]?.id ?? "");

  // Extras compatibles con la categoría de un pack (vacío appliesTo = compatible con todo).
  const extrasFor = (id: string) => {
    const cat = options.packs.find((p) => p.id === id)?.category ?? null;
    return options.extras.filter(
      (e) => e.appliesTo.length === 0 || (cat != null && e.appliesTo.includes(cat)),
    );
  };
  const visibleExtras = extrasFor(packId);

  // Actividades adicionales (segunda, tercera…). La primera es el bloque principal.
  type Activity = { packId: string; hours: string; extraIds: string[] };
  const [activities, setActivities] = useState<Activity[]>([]);
  const addActivity = () =>
    setActivities((a) => [...a, { packId: options.packs[0]?.id ?? "", hours: "4", extraIds: [] }]);
  const removeActivity = (i: number) => setActivities((a) => a.filter((_, idx) => idx !== i));
  const patchActivity = (i: number, patch: Partial<Activity>) =>
    setActivities((a) => a.map((act, idx) => (idx === i ? { ...act, ...patch } : act)));
  const toggleActivityExtra = (i: number, extraId: string) =>
    setActivities((a) =>
      a.map((act, idx) =>
        idx === i
          ? {
              ...act,
              extraIds: act.extraIds.includes(extraId)
                ? act.extraIds.filter((x) => x !== extraId)
                : [...act.extraIds, extraId],
            }
          : act,
      ),
    );
  const packName = (id: string) => options.packs.find((p) => p.id === id)?.name ?? "";
  const extraName = (id: string) => options.extras.find((e) => e.id === id)?.name ?? "";

  if (state.status === "booked") {
    return (
      <div className="max-w-2xl rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          </span>
          <div>
            <h2 className="text-lg font-semibold text-emerald-300">{t("bookedTitle")}</h2>
            <p className="text-brand-muted mt-1.5 text-sm">{t("bookedText")}</p>
          </div>
        </div>

        {/* Mientras tanto: canales directos y contenido para seguir explorando */}
        <div className="mt-6 border-t border-emerald-500/20 pt-5">
          <p className="text-sm font-medium text-white">{t("bookedMeanwhile")}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-visible:ring-brand-neon/50 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4.5 w-4.5"
                  aria-hidden="true"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.02 0-1.43.75-2.14 1.02-2.43.27-.29.59-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.03.89 2.18.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.16-.29.37-.41.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.6.76 1.87.9.27.13.45.2.51.31.07.11.07.66-.17 1.34Z" />
                </svg>
                {t("bookedWhatsapp")}
              </a>
            )}
            <Link
              href={`/${locale}/packs`}
              className="border-brand-border text-brand-text hover:border-brand-neon/60 focus-visible:ring-brand-neon/50 inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:text-white focus-visible:ring-2 focus-visible:outline-none"
            >
              {t("bookedPacks")}
            </Link>
            {phone && phoneHref && (
              <a
                href={phoneHref}
                className="border-brand-border text-brand-text hover:border-brand-neon/60 focus-visible:ring-brand-neon/50 inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:text-white focus-visible:ring-2 focus-visible:outline-none"
              >
                {t("bookedCall", { phone })}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Construye un mensaje estructurado de WhatsApp con la selección actual.
  function whatsappHref(): string {
    const f = formRef.current;
    if (!f || !whatsappUrl) return whatsappUrl ?? "#";
    const fd = new FormData(f);
    const packSel = f.querySelector<HTMLSelectElement>('select[name="packId"]');
    const primaryName = packSel?.selectedOptions[0]?.textContent?.trim() || "";
    const extras = Array.from(
      f.querySelectorAll<HTMLInputElement>('input[name="extras"]:checked'),
    ).map((el) => el.closest("label")?.textContent?.trim() || "");
    const lines = [
      t("waIntro"),
      primaryName ? `• ${t("pack")}: ${primaryName}` : "",
      fd.get("date") ? `• ${t("date")}: ${fd.get("date")}` : "",
      fd.get("eventTime") ? `• ${t("eventTime")}: ${fd.get("eventTime")}` : "",
      fd.get("attendees") ? `• ${t("attendees")}: ${fd.get("attendees")}` : "",
      fd.get("province") ? `• ${t("province")}: ${fd.get("province")}` : "",
      fd.get("hours") ? `• ${t("hours")}: ${fd.get("hours")} h` : "",
      f.querySelector<HTMLInputElement>('input[name="night"]')?.checked ? `• ${t("night")}` : "",
      extras.length ? `• ${t("extras")}: ${extras.join(", ")}` : "",
      ...activities.map((a, i) => {
        const ex = a.extraIds.map(extraName).filter(Boolean);
        return `• ${t("activity")} ${i + 2}: ${packName(a.packId)} (${a.hours} h)${ex.length ? ` — ${ex.join(", ")}` : ""}`;
      }),
      fd.get("name") ? `\n${fd.get("name")}${fd.get("phone") ? ` · ${fd.get("phone")}` : ""}` : "",
    ].filter(Boolean);
    return `${whatsappUrl}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="border-brand-border bg-brand-surface max-w-2xl rounded-2xl border p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot anti-spam: invisible para humanos */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* Referencia del pack seleccionado (al venir desde su ficha) */}
      {defaultPackName && (
        <div className="border-brand-neon/30 bg-brand-neon/10 mb-6 rounded-xl border px-4 py-3">
          <p className="text-brand-muted text-xs">{t("forPack")}</p>
          <p className="font-semibold text-white">{defaultPackName}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="packId" className="text-brand-text text-sm font-medium">
            {t("pack")}
          </label>
          <select
            id="packId"
            name="packId"
            required
            value={packId}
            onChange={(e) => setPackId(e.target.value)}
            className={inputClass}
          >
            {options.packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-brand-text text-sm font-medium">
            {t("date")}
          </label>
          <input id="date" name="date" type="date" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eventTime" className="text-brand-text text-sm font-medium">
            {t("eventTime")}
          </label>
          <input id="eventTime" name="eventTime" type="time" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="attendees" className="text-brand-text text-sm font-medium">
            {t("attendees")}
          </label>
          <input
            id="attendees"
            name="attendees"
            type="number"
            min={1}
            max={5000}
            placeholder={t("attendeesPlaceholder")}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hours" className="text-brand-text text-sm font-medium">
            {t("hours")}
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            min={1}
            max={48}
            defaultValue={4}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="province" className="text-brand-text text-sm font-medium">
            {t("province")}
          </label>
          <select id="province" name="province" className={inputClass}>
            <option value="">{t("noProvince")}</option>
            {options.provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="text-brand-text mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" name="night" className="accent-brand-neon h-4 w-4" />
        {t("night")}
      </label>

      <div className="mt-5 flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="code" className="text-brand-text text-sm font-medium">
          {t("discountCode")}
        </label>
        <input
          id="code"
          name="code"
          maxLength={40}
          placeholder={t("discountCodePlaceholder")}
          className={inputClass}
        />
      </div>

      {visibleExtras.length > 0 && (
        <fieldset className="mt-5">
          <legend className="text-brand-text text-sm font-medium">{t("extras")}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {visibleExtras.map((e) => (
              <label key={e.id} className="text-brand-muted flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="extras"
                  value={e.id}
                  className="accent-brand-neon h-4 w-4"
                />
                {e.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Actividades adicionales */}
      <input type="hidden" name="activities" value={JSON.stringify(activities)} />
      {activities.map((act, i) => {
        const acExtras = extrasFor(act.packId);
        return (
          <div key={i} className="border-brand-border bg-brand-bg mt-5 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {t("activity")} {i + 2}
              </span>
              <button
                type="button"
                onClick={() => removeActivity(i)}
                className="text-brand-muted text-sm transition hover:text-red-400"
              >
                {t("removeActivity")}
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={act.packId}
                onChange={(e) => patchActivity(i, { packId: e.target.value, extraIds: [] })}
                className={inputClass}
                aria-label={t("pack")}
              >
                {options.packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={48}
                value={act.hours}
                onChange={(e) => patchActivity(i, { hours: e.target.value })}
                className={inputClass}
                aria-label={t("hours")}
              />
            </div>
            {acExtras.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {acExtras.map((e) => (
                  <label key={e.id} className="text-brand-muted flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={act.extraIds.includes(e.id)}
                      onChange={() => toggleActivityExtra(i, e.id)}
                      className="accent-brand-neon h-4 w-4"
                    />
                    {e.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addActivity}
        className="border-brand-border text-brand-text hover:border-brand-neon/60 mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition"
      >
        + {t("addActivity")}
      </button>

      {/* Datos del cliente */}
      <div className="border-brand-border mt-8 border-t pt-6">
        <h3 className="font-semibold text-white">{t("yourData")}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-brand-text text-sm">
              {t("name")} *
            </label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-brand-text text-sm">
              {t("email")} *
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-brand-text text-sm">
              {t("phone")}
            </label>
            <input id="phone" name="phone" type="tel" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="message" className="text-brand-text text-sm">
              {t("messageLabel")}
            </label>
            <textarea id="message" name="message" rows={3} className={inputClass} />
          </div>
        </div>

        <label className="text-brand-muted mt-4 flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="acceptedTerms"
            className="accent-brand-neon mt-0.5 h-4 w-4"
          />
          <span>
            {t.rich("terms", {
              link: (chunks) => (
                <Link href={`/${locale}/privacidad`} className="text-brand-neon underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        <label className="text-brand-muted mt-2 flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="marketing" className="accent-brand-neon mt-0.5 h-4 w-4" />
          <span>{t("marketing")}</span>
        </label>
      </div>

      <Turnstile />

      {state.status === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {state.message ?? t("error")}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-neon text-brand-bg hover:bg-brand-neon-strong w-full rounded-full px-6 py-3 font-semibold transition disabled:opacity-60 sm:w-auto"
        >
          {pending ? t("sending") : t("submitBooking")}
        </button>
        {whatsappUrl && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.open(whatsappHref(), "_blank", "noopener,noreferrer");
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white transition hover:brightness-110 sm:w-auto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.02 0-1.43.75-2.14 1.02-2.43.27-.29.59-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.03.89 2.18.07.15.12.32.02.51-.09.19-.14.31-.27.48-.14.16-.29.37-.41.49-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.2.68-.79.86-1.06.18-.27.36-.22.61-.13.25.09 1.6.76 1.87.9.27.13.45.2.51.31.07.11.07.66-.17 1.34Z" />
            </svg>
            {t("whatsappQuote")}
          </a>
        )}
      </div>
    </form>
  );
}
