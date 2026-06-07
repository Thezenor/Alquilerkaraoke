"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { unsubscribeAction, type UnsubscribeState } from "./actions";

const initialState: UnsubscribeState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export function UnsubscribeForm() {
  const t = useTranslations("Unsubscribe");
  const [state, formAction, pending] = useActionState(unsubscribeAction, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300">
        {t("success")}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-brand-text">
          {t("emailLabel")} <span className="text-brand-neon">*</span>
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
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
