"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { quoteAction, type QuoteState } from "./actions";

const initial: QuoteState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type QuoteOptions = {
  packs: { id: string; name: string; category?: string | null }[];
  extras: { id: string; name: string; category?: string | null }[];
  provinces: string[];
};

export function QuoteForm({
  options,
  defaultPackId,
  defaultPackName,
  whatsappUrl,
}: {
  options: QuoteOptions;
  defaultPackId?: string | null;
  defaultPackName?: string | null;
  whatsappUrl?: string;
}) {
  const t = useTranslations("Quote");
  const locale = useLocale();
  const [state, action, pending] = useActionState(quoteAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.status === "booked") {
    return (
      <div className="max-w-2xl rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">{t("bookedTitle")}</h2>
        <p className="mt-2 text-sm text-brand-muted">{t("bookedText")}</p>
      </div>
    );
  }

  // Construye un mensaje estructurado de WhatsApp con la selección actual.
  function whatsappHref(): string {
    const f = formRef.current;
    if (!f || !whatsappUrl) return whatsappUrl ?? "#";
    const fd = new FormData(f);
    const packSel = f.querySelector<HTMLSelectElement>('select[name="packId"]');
    const packName = packSel?.selectedOptions[0]?.textContent?.trim() || "";
    const extras = Array.from(f.querySelectorAll<HTMLInputElement>('input[name="extras"]:checked')).map(
      (el) => el.closest("label")?.textContent?.trim() || "",
    );
    const lines = [
      t("waIntro"),
      packName ? `• ${t("pack")}: ${packName}` : "",
      fd.get("date") ? `• ${t("date")}: ${fd.get("date")}` : "",
      fd.get("eventTime") ? `• ${t("eventTime")}: ${fd.get("eventTime")}` : "",
      fd.get("attendees") ? `• ${t("attendees")}: ${fd.get("attendees")}` : "",
      fd.get("province") ? `• ${t("province")}: ${fd.get("province")}` : "",
      fd.get("hours") ? `• ${t("hours")}: ${fd.get("hours")} h` : "",
      f.querySelector<HTMLInputElement>('input[name="night"]')?.checked ? `• ${t("night")}` : "",
      extras.length ? `• ${t("extras")}: ${extras.join(", ")}` : "",
      fd.get("name") ? `\n${fd.get("name")}${fd.get("phone") ? ` · ${fd.get("phone")}` : ""}` : "",
    ].filter(Boolean);
    return `${whatsappUrl}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  return (
    <form ref={formRef} action={action} className="max-w-2xl rounded-2xl border border-brand-border bg-brand-surface p-6">
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
        <div className="mb-6 rounded-xl border border-brand-neon/30 bg-brand-neon/10 px-4 py-3">
          <p className="text-xs text-brand-muted">{t("forPack")}</p>
          <p className="font-semibold text-white">{defaultPackName}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="packId" className="text-sm font-medium text-brand-text">{t("pack")}</label>
          <select id="packId" name="packId" required defaultValue={defaultPackId ?? undefined} className={inputClass}>
            {options.packs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-brand-text">{t("date")}</label>
          <input id="date" name="date" type="date" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="eventTime" className="text-sm font-medium text-brand-text">{t("eventTime")}</label>
          <input id="eventTime" name="eventTime" type="time" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="attendees" className="text-sm font-medium text-brand-text">{t("attendees")}</label>
          <input id="attendees" name="attendees" type="number" min={1} max={5000} placeholder={t("attendeesPlaceholder")} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hours" className="text-sm font-medium text-brand-text">{t("hours")}</label>
          <input id="hours" name="hours" type="number" min={1} max={48} defaultValue={4} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="province" className="text-sm font-medium text-brand-text">{t("province")}</label>
          <select id="province" name="province" className={inputClass}>
            <option value="">{t("noProvince")}</option>
            {options.provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="night" className="h-4 w-4 accent-brand-neon" />
        {t("night")}
      </label>

      <div className="mt-5 flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="code" className="text-sm font-medium text-brand-text">{t("discountCode")}</label>
        <input id="code" name="code" maxLength={40} placeholder={t("discountCodePlaceholder")} className={inputClass} />
      </div>

      {options.extras.length > 0 && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-brand-text">{t("extras")}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {options.extras.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm text-brand-muted">
                <input type="checkbox" name="extras" value={e.id} className="h-4 w-4 accent-brand-neon" />
                {e.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Datos del cliente */}
      <div className="mt-8 border-t border-brand-border pt-6">
        <h3 className="font-semibold text-white">{t("yourData")}</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm text-brand-text">{t("name")} *</label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-brand-text">{t("email")} *</label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm text-brand-text">{t("phone")}</label>
            <input id="phone" name="phone" type="tel" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="message" className="text-sm text-brand-text">{t("messageLabel")}</label>
            <textarea id="message" name="message" rows={3} className={inputClass} />
          </div>
        </div>

        <label className="mt-4 flex items-start gap-2.5 text-sm text-brand-muted">
          <input type="checkbox" name="acceptedTerms" className="mt-0.5 h-4 w-4 accent-brand-neon" />
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
        <label className="mt-2 flex items-start gap-2.5 text-sm text-brand-muted">
          <input type="checkbox" name="marketing" className="mt-0.5 h-4 w-4 accent-brand-neon" />
          <span>{t("marketing")}</span>
        </label>
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-4 text-sm text-red-400">{state.message ?? t("error")}</p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-brand-neon px-6 py-3 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60 sm:w-auto"
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
