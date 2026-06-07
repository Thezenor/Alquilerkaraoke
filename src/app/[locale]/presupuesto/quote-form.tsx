"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { calculateQuote, type QuoteState } from "./actions";
import { formatCents } from "@/lib/money";

const initial: QuoteState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type QuoteOptions = {
  packs: { id: string; name: string; includedHours: number }[];
  extras: { id: string; name: string; price: number }[];
  provinces: string[];
};

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${strong ? "text-white" : "text-brand-muted"}`}>
      <span>{label}</span>
      <span className={strong ? "font-semibold" : ""}>{formatCents(value)}</span>
    </div>
  );
}

export function QuoteForm({ options }: { options: QuoteOptions }) {
  const t = useTranslations("Quote");
  const locale = useLocale();
  const [state, action, pending] = useActionState(calculateQuote, initial);
  const r = state.result;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form action={action} className="rounded-2xl border border-brand-border bg-brand-surface p-6">
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

        {options.extras.length > 0 && (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-brand-text">{t("extras")}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {options.extras.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm text-brand-muted">
                  <input type="checkbox" name="extras" value={e.id} className="h-4 w-4 accent-brand-neon" />
                  {e.name} <span className="text-xs">({formatCents(e.price)})</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-brand-neon px-6 py-3 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60 sm:w-auto"
        >
          {pending ? t("calculating") : t("calculate")}
        </button>

        {state.status === "error" && (
          <p role="alert" className="mt-4 text-sm text-red-400">{state.message ?? t("error")}</p>
        )}
      </form>

      {/* Resultado */}
      <aside className="rounded-2xl border border-brand-border bg-brand-surface p-6">
        {!r ? (
          <p className="text-sm text-brand-muted">{t("intro")}</p>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-white">{t("resultTitle")}</h2>
            <p className="mt-1 text-sm text-brand-neon">{r.packName}</p>
            <div className="mt-4 border-t border-brand-border pt-4 text-sm">
              <Row label={t("base")} value={r.base} />
              {r.extraHours > 0 && <Row label={t("extraHours")} value={r.extraHours} />}
              {r.province > 0 && <Row label={t("provinceLabel")} value={r.province} />}
              {r.extras > 0 && <Row label={t("extrasLabel")} value={r.extras} />}
              {r.surcharges > 0 && <Row label={t("surcharges")} value={r.surcharges} />}
              <div className="my-2 border-t border-brand-border" />
              <Row label={t("subtotal")} value={r.subtotal} />
              <Row label={t("vat")} value={r.vat} />
              <div className="my-2 border-t border-brand-border" />
              <Row label={t("total")} value={r.total} strong />
              <div className="my-2 border-t border-brand-border" />
              <Row label={t("deposit")} value={r.deposit} />
              {r.securityDeposit > 0 && <Row label={t("securityDeposit")} value={r.securityDeposit} />}
            </div>
            <p className="mt-4 text-xs text-brand-muted">{t("estimateNote")}</p>
            <a
              href={`/${locale}/contacto`}
              className="mt-5 inline-flex rounded-full bg-brand-neon px-5 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
            >
              {t("ctaContact")}
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
