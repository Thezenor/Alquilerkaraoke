"use client";

import { useActionState, useState, useTransition } from "react";
import { saveEventType, generateEventBody, type EventFormState } from "./actions";

const initial: EventFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type EventFormValues = {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  intro: string;
  description: string;
  features: string; // una por línea
  faq: string; // "pregunta | respuesta" por línea
  heroImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  sortOrder: string;
  isActive: boolean;
};

export function EventForm({ values }: { values: EventFormValues }) {
  const [state, formAction, pending] = useActionState(saveEventType, initial);
  const [description, setDescription] = useState(values.description);
  const [aiPending, startAi] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  function handleGenerate() {
    if (!values.id) return;
    setAiError(null);
    startAi(async () => {
      const res = await generateEventBody(values.id!);
      if (res.ok && res.text) setDescription(res.text);
      else setAiError(res.error ?? "No se pudo generar.");
    });
  }

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre <span className="text-brand-neon">*</span></span>
          <input name="name" required maxLength={120} defaultValue={values.name} placeholder="Bodas" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Slug</span>
          <input name="slug" maxLength={120} defaultValue={values.slug} placeholder="Se genera del nombre" className={inputClass} />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Descripción corta (tarjeta y meta)</span>
          <input name="shortDescription" maxLength={300} defaultValue={values.shortDescription} className={inputClass} />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Intro (bajo el H1)</span>
          <textarea name="intro" rows={2} defaultValue={values.intro} className={`${inputClass} resize-y`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Imagen (URL)</span>
          <input name="heroImageUrl" maxLength={500} defaultValue={values.heroImageUrl} placeholder="https://…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Orden</span>
          <input name="sortOrder" type="number" min={0} defaultValue={values.sortOrder} placeholder="0" className={inputClass} />
        </label>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-brand-text">Contenido (Markdown)</span>
          {values.id && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiPending}
              className="rounded-full border border-brand-neon/50 px-3 py-1 text-xs font-medium text-brand-neon transition hover:bg-brand-neon/10 disabled:opacity-50"
            >
              {aiPending ? "Generando…" : "✨ Generar con IA"}
            </button>
          )}
        </div>
        <textarea
          name="description"
          rows={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Contenido (Markdown)"
          placeholder={"## Subtítulo\n\nTexto del evento en Markdown…"}
          className={`${inputClass} mt-1.5 w-full resize-y font-mono text-sm`}
        />
        {aiError && <p className="mt-1 text-xs text-red-400">{aiError}</p>}
        {values.id && <p className="mt-1 text-xs text-brand-muted">La IA genera un borrador; revísalo y pulsa «Guardar».</p>}
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Qué incluye (una ventaja por línea)</span>
        <textarea name="features" rows={5} defaultValue={values.features} placeholder={"Montaje completo de sonido e iluminación\nCon o sin técnico\nMiles de canciones"} className={`${inputClass} resize-y`} />
      </label>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Preguntas frecuentes (una por línea: «pregunta | respuesta»)</span>
        <textarea name="faq" rows={5} defaultValue={values.faq} placeholder={"¿Hacéis bodas en fincas? | Sí, llevamos el montaje a toda España."} className={`${inputClass} resize-y font-mono text-xs`} />
      </label>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Meta title (SEO)</span>
          <input name="metaTitle" maxLength={140} defaultValue={values.metaTitle} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Meta description (SEO)</span>
          <input name="metaDescription" maxLength={300} defaultValue={values.metaDescription} className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" /> Activo (visible en la web)
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
