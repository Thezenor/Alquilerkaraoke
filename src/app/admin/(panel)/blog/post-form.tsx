"use client";

import { useActionState } from "react";
import { savePost, type PostFormState } from "./actions";

const initial: PostFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type PostFormValues = {
  id?: string;
  title: string;
  slug: string;
  locale: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  status: "DRAFT" | "PUBLISHED";
};

export function PostForm({ values }: { values: PostFormValues }) {
  const [state, formAction, pending] = useActionState(savePost, initial);

  return (
    <form action={formAction} className="max-w-3xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Título <span className="text-brand-neon">*</span></span>
          <input name="title" required maxLength={200} defaultValue={values.title} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Slug <span className="text-brand-neon">*</span></span>
          <input name="slug" required maxLength={160} defaultValue={values.slug} placeholder="mi-articulo" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Idioma</span>
          <select name="locale" defaultValue={values.locale} className={inputClass}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Extracto</span>
          <textarea name="excerpt" rows={2} maxLength={400} defaultValue={values.excerpt} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Imagen de portada (URL)</span>
          <input name="coverImageUrl" maxLength={500} defaultValue={values.coverImageUrl} placeholder="https://…" className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">
          Contenido <span className="text-brand-neon">*</span>
          <span className="ml-2 font-normal text-brand-muted">Markdown: # títulos, **negrita**, - listas, [texto](url)</span>
        </span>
        <textarea name="content" required rows={16} maxLength={50000} defaultValue={values.content} className={`${inputClass} font-mono text-sm`} />
      </label>

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

      <label className="mt-5 flex flex-col gap-1.5 sm:max-w-xs">
        <span className="text-sm font-medium text-brand-text">Estado</span>
        <select name="status" defaultValue={values.status} className={inputClass}>
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicado</option>
        </select>
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar entrada"}
      </button>
    </form>
  );
}
