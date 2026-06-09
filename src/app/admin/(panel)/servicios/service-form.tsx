"use client";

import { useActionState, useState, useTransition } from "react";
import { saveService, generateServiceDescription, type ServiceFormState } from "./actions";

const initial: ServiceFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type ServiceFormValues = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  heroImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  sortOrder: string;
  isActive: boolean;
  name_en: string;
  short_en: string;
  desc_en: string;
  name_fr: string;
  short_fr: string;
  desc_fr: string;
};

export function ServiceForm({ values, categories }: { values: ServiceFormValues; categories: string[] }) {
  const [state, formAction, pending] = useActionState(saveService, initial);
  const [description, setDescription] = useState(values.description);
  const [aiPending, startAi] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  function handleGenerate() {
    if (!values.id) return;
    setAiError(null);
    startAi(async () => {
      const res = await generateServiceDescription(values.id!);
      if (res.ok && res.text) setDescription(res.text);
      else setAiError(res.error ?? "No se pudo generar.");
    });
  }

  return (
    <form action={formAction} className="max-w-3xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre <span className="text-brand-neon">*</span></span>
          <input name="name" required maxLength={120} defaultValue={values.name} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Slug <span className="text-brand-neon">*</span></span>
          <input name="slug" required maxLength={120} defaultValue={values.slug} placeholder="karaoke" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Categoría de packs</span>
          <input name="category" list="cats" defaultValue={values.category} placeholder="Ej. Karaoke" className={inputClass} />
          <datalist id="cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <span className="text-xs text-brand-muted">Los packs con esta categoría se listan en la página del servicio.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Orden</span>
          <input name="sortOrder" type="number" defaultValue={values.sortOrder} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Descripción corta</span>
          <input name="shortDescription" maxLength={400} defaultValue={values.shortDescription} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Imagen de cabecera (URL)</span>
          <input name="heroImageUrl" maxLength={500} defaultValue={values.heroImageUrl} placeholder="https://…" className={inputClass} />
        </label>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-brand-text">
            Descripción (SEO)
            <span className="ml-2 font-normal text-brand-muted">Markdown: # títulos, **negrita**, - listas, [texto](url)</span>
          </span>
          {values.id && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiPending}
              className="shrink-0 rounded-full border border-brand-neon/50 px-3 py-1 text-xs font-medium text-brand-neon transition hover:bg-brand-neon/10 disabled:opacity-50"
            >
              {aiPending ? "Generando…" : "✨ Generar con IA"}
            </button>
          )}
        </div>
        <textarea
          name="description"
          rows={10}
          maxLength={20000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Descripción (SEO)"
          className={`${inputClass} mt-1.5 w-full font-mono text-sm`}
        />
        {aiError && <p className="mt-1 text-xs text-red-400">{aiError}</p>}
        {values.id && <p className="mt-1 text-xs text-brand-muted">La IA genera un borrador; revísalo y pulsa «Guardar».</p>}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-brand-muted uppercase">SEO (opcional)</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Meta título</span>
          <input name="metaTitle" maxLength={200} defaultValue={values.metaTitle} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Meta descripción</span>
          <input name="metaDescription" maxLength={320} defaultValue={values.metaDescription} className={inputClass} />
        </label>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-brand-muted uppercase">Traducciones (opcional)</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre (EN)</span>
          <input name="name_en" maxLength={120} defaultValue={values.name_en} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre (FR)</span>
          <input name="name_fr" maxLength={120} defaultValue={values.name_fr} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Descripción (EN)</span>
          <textarea name="desc_en" rows={5} maxLength={20000} defaultValue={values.desc_en} className={`${inputClass} font-mono text-sm`} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Descripción (FR)</span>
          <textarea name="desc_fr" rows={5} maxLength={20000} defaultValue={values.desc_fr} className={`${inputClass} font-mono text-sm`} />
        </label>
        <input type="hidden" name="short_en" value={values.short_en} />
        <input type="hidden" name="short_fr" value={values.short_fr} />
      </div>

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
        {pending ? "Guardando…" : "Guardar servicio"}
      </button>
    </form>
  );
}
