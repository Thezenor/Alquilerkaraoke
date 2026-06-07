"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { quoteAction, type QuoteState } from "./actions";

const initial: QuoteState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type QuoteOptions = {
  packs: { id: string; name: string }[];
  extras: { id: string; name: string }[];
  provinces: string[];
};

export function QuoteForm({ options }: { options: QuoteOptions }) {
  const t = useTranslations("Quote");
  const locale = useLocale();
  const [state, action, pending] = useActionState(quoteAction, initial);

  if (state.status === "booked") {
    return (
      <div className="max-w-2xl rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
        <h2 className="text-lg font-semibold text-emerald-300">{t("bookedTitle")}</h2>
        <p className="mt-2 text-sm text-brand-muted">{t("bookedText")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-2xl rounded-2xl border border-brand-border bg-brand-surface p-6">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="packId" className="text-sm font-medium text-brand-text">{t("pack")}</label>
          <select id="packId" name="packId" required className={inputClass}>
            {options.packs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="hours" className="text-sm font-medium text-brand-text">{t("hours")}</label>
          <input id="hours" name="hours" type="number" min={1} max={48} defaultValue={4} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-brand-text">{t("date")}</label>
          <input id="date" name="date" type="date" className={inputClass} />
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

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-brand-neon px-6 py-3 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("sending") : t("submitBooking")}
      </button>
    </form>
  );
}
