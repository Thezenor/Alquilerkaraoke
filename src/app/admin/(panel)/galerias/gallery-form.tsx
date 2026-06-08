"use client";

import { useActionState } from "react";
import { saveGallery, type GalleryFormState } from "./actions";

const initial: GalleryFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type GalleryFormValues = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  expiresAt: string;
  sortOrder: string;
  isListed: boolean;
  allowDownload: boolean;
  isActive: boolean;
  hasPassword: boolean;
};

export function GalleryForm({ values }: { values: GalleryFormValues }) {
  const [state, formAction, pending] = useActionState(saveGallery, initial);

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Título <span className="text-brand-neon">*</span></span>
          <input name="title" required maxLength={120} defaultValue={values.title} placeholder="Boda de Ana y Luis" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Slug</span>
          <input name="slug" maxLength={120} defaultValue={values.slug} placeholder="Se genera del título" className={inputClass} />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Descripción</span>
          <textarea name="description" rows={2} defaultValue={values.description} className={`${inputClass} resize-y`} />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Imagen de portada (URL)</span>
          <input name="coverImageUrl" maxLength={500} defaultValue={values.coverImageUrl} placeholder="https://…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Caduca el</span>
          <input name="expiresAt" type="date" defaultValue={values.expiresAt} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Orden</span>
          <input name="sortOrder" type="number" min={0} defaultValue={values.sortOrder} placeholder="0" className={inputClass} />
        </label>
      </div>

      <div className="mt-6 rounded-xl border border-brand-border bg-brand-bg/40 p-4">
        <p className="text-sm font-medium text-brand-text">Privacidad por clave</p>
        <p className="mt-1 text-xs text-brand-muted">
          {values.hasPassword
            ? "Esta galería tiene clave. Escribe una nueva para cambiarla, o marca «quitar clave»."
            : "Deja la clave vacía para una galería abierta. Si pones clave, se pedirá para verla."}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-text">Clave de acceso</span>
            <input name="password" type="text" maxLength={100} autoComplete="off" placeholder={values.hasPassword ? "•••••• (sin cambios)" : "Opcional"} className={inputClass} />
          </label>
          {values.hasPassword && (
            <label className="flex items-center gap-2 pb-1.5 text-sm text-brand-text">
              <input type="checkbox" name="removePassword" className="h-4 w-4 accent-brand-neon" /> Quitar clave (hacerla abierta)
            </label>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="isListed" defaultChecked={values.isListed} className="h-4 w-4 accent-brand-neon" /> Listada en /galerias
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="allowDownload" defaultChecked={values.allowDownload} className="h-4 w-4 accent-brand-neon" /> Permitir descarga
        </label>
        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" /> Activa
        </label>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar galería"}
      </button>
    </form>
  );
}
