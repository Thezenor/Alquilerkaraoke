"use client";

import { useActionState } from "react";
import { saveTestimonial, type TestimonialFormState } from "./actions";

const initial: TestimonialFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type TestimonialFormValues = {
  id?: string;
  authorName: string;
  eventType: string;
  quote: string;
  rating: string;
  locale: string;
  sourceUrl: string;
  sortOrder: string;
  isActive: boolean;
};

export function TestimonialForm({ values }: { values: TestimonialFormValues }) {
  const [state, formAction, pending] = useActionState(saveTestimonial, initial);

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre <span className="text-brand-neon">*</span></span>
          <input name="authorName" required maxLength={120} defaultValue={values.authorName} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Tipo de evento</span>
          <input
            name="eventType"
            maxLength={160}
            placeholder="Boda en Sevilla, fiesta de empresa…"
            defaultValue={values.eventType}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Valoración (1–5) <span className="text-brand-neon">*</span></span>
          <select name="rating" defaultValue={values.rating} className={inputClass}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "estrella" : "estrellas"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Idioma</span>
          <select name="locale" defaultValue={values.locale} className={inputClass}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Enlace a la reseña (URL)</span>
          <input
            name="sourceUrl"
            type="url"
            placeholder="https://… (reseña de Google, opcional)"
            defaultValue={values.sourceUrl}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Orden</span>
          <input name="sortOrder" type="number" defaultValue={values.sortOrder} className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Testimonio <span className="text-brand-neon">*</span></span>
        <textarea name="quote" required rows={4} maxLength={1000} defaultValue={values.quote} className={inputClass} />
      </label>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" />
        Activo (visible en la web)
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar testimonio"}
      </button>
    </form>
  );
}
