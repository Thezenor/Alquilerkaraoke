"use client";

import { useActionState } from "react";
import { unlockGallery, type UnlockState } from "./actions";

const initial: UnlockState = { status: "idle" };

export function UnlockForm({ locale, slug, labels }: { locale: string; slug: string; labels: { prompt: string; placeholder: string; button: string } }) {
  const [state, formAction, pending] = useActionState(unlockGallery, initial);

  return (
    <form action={formAction} className="mx-auto mt-8 max-w-sm">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="slug" value={slug} />
      <label htmlFor="gal-pw" className="block text-sm text-brand-muted">{labels.prompt}</label>
      <input
        id="gal-pw"
        name="password"
        type="password"
        required
        autoComplete="off"
        placeholder={labels.placeholder}
        className="mt-2 w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-white outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
      />
      {state.status === "error" && state.message && (
        <p role="alert" className="mt-2 text-sm text-red-400">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60"
      >
        {pending ? "…" : labels.button}
      </button>
    </form>
  );
}
