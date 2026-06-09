"use client";

import { useActionState, useState, useTransition } from "react";
import { savePost, generateBlogDraft, type PostFormState } from "./actions";

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

  const [title, setTitle] = useState(values.title);
  const [locale, setLocale] = useState(values.locale);
  const [excerpt, setExcerpt] = useState(values.excerpt);
  const [content, setContent] = useState(values.content);
  const [metaTitle, setMetaTitle] = useState(values.metaTitle);
  const [metaDescription, setMetaDescription] = useState(values.metaDescription);
  const [brief, setBrief] = useState("");
  const [aiPending, startAi] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  function handleGenerate() {
    setAiError(null);
    startAi(async () => {
      const res = await generateBlogDraft({ title, locale, brief });
      if (res.ok && res.draft) {
        setExcerpt(res.draft.excerpt ?? "");
        setContent(res.draft.content ?? "");
        setMetaTitle(res.draft.metaTitle ?? "");
        setMetaDescription(res.draft.metaDescription ?? "");
      } else {
        setAiError(res.error ?? "No se pudo generar.");
      }
    });
  }

  return (
    <form action={formAction} className="max-w-3xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Título <span className="text-brand-neon">*</span></span>
          <input name="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Slug <span className="text-brand-neon">*</span></span>
          <input name="slug" required maxLength={160} defaultValue={values.slug} placeholder="mi-articulo" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Idioma</span>
          <select name="locale" value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </label>
      </div>

      {/* Asistente IA: redacta el artículo desde el título */}
      <div className="mt-5 rounded-xl border border-brand-neon/30 bg-brand-neon/5 p-4">
        <p className="text-sm font-medium text-brand-text">Asistente de redacción (IA)</p>
        <p className="mt-1 text-xs text-brand-muted">
          Escribe el título arriba y, si quieres, un enfoque. La IA generará un borrador (extracto, contenido y SEO) que podrás revisar y editar.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Enfoque opcional: p. ej. consejos para elegir karaoke en bodas"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={aiPending}
            className="shrink-0 rounded-full border border-brand-neon/60 px-4 py-2 text-sm font-medium text-brand-neon transition hover:bg-brand-neon/10 disabled:opacity-50"
          >
            {aiPending ? "Generando…" : "✨ Generar borrador"}
          </button>
        </div>
        {aiError && <p className="mt-2 text-xs text-red-400">{aiError}</p>}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-1">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Imagen de portada (URL)</span>
          <input name="coverImageUrl" maxLength={500} defaultValue={values.coverImageUrl} placeholder="https://… o sube desde Eventos/Galerías" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Extracto</span>
          <textarea name="excerpt" rows={2} maxLength={400} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">
          Contenido <span className="text-brand-neon">*</span>
          <span className="ml-2 font-normal text-brand-muted">Markdown: # títulos, **negrita**, - listas, [texto](url)</span>
        </span>
        <textarea name="content" required rows={16} maxLength={50000} value={content} onChange={(e) => setContent(e.target.value)} className={`${inputClass} font-mono text-sm`} />
      </label>

      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide text-brand-muted uppercase">SEO (opcional)</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Meta título</span>
          <input name="metaTitle" maxLength={200} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Meta descripción</span>
          <input name="metaDescription" maxLength={320} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={inputClass} />
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
