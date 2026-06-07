"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { submitContactRequest, type ContactFormState } from "./actions";

const initialState: ContactFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export function ContactForm() {
  const t = useTranslations("Contact.form");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitContactRequest, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300">
        {t("success")}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-brand-text">
            {t("name")} <span className="text-brand-neon">*</span>
          </label>
          <input id="name" name="name" required maxLength={120} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-brand-text">
            {t("email")} <span className="text-brand-neon">*</span>
          </label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-brand-text">
            {t("phone")}
          </label>
          <input id="phone" name="phone" type="tel" maxLength={40} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-sm font-medium text-brand-text">
            {t("city")}
          </label>
          <input id="city" name="city" maxLength={120} className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-brand-text">
          {t("message")} <span className="text-brand-neon">*</span>
        </label>
        <textarea id="message" name="message" required rows={5} maxLength={4000} className={inputClass} />
      </div>

      <div className="flex flex-col gap-2.5">
        <label className="flex items-start gap-2.5 text-sm text-brand-muted">
          <input type="checkbox" name="acceptedTerms" required className="mt-0.5 h-4 w-4 accent-brand-neon" />
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
        <label className="flex items-start gap-2.5 text-sm text-brand-muted">
          <input type="checkbox" name="marketing" className="mt-0.5 h-4 w-4 accent-brand-neon" />
          <span>{t("marketing")}</span>
        </label>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {t("error")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-full bg-brand-neon px-6 py-3 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
