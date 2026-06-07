"use client";

import { useActionState } from "react";
import { saveCollaborator, type CollaboratorFormState } from "./actions";

const initial: CollaboratorFormState = { status: "idle" };

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export type CollaboratorFormValues = {
  id?: string;
  name: string;
  url: string;
  logoUrl: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

export function CollaboratorForm({ values }: { values: CollaboratorFormValues }) {
  const [state, formAction, pending] = useActionState(saveCollaborator, initial);

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Nombre <span className="text-brand-neon">*</span></span>
          <input name="name" required maxLength={120} defaultValue={values.name} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Enlace (URL)</span>
          <input name="url" type="url" placeholder="https://…" defaultValue={values.url} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Logo (URL)</span>
          <input name="logoUrl" placeholder="https://… (vacío = se muestra el nombre)" defaultValue={values.logoUrl} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-text">Orden</span>
          <input name="sortOrder" type="number" defaultValue={values.sortOrder} className={inputClass} />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-sm font-medium text-brand-text">Descripción</span>
        <textarea name="description" rows={3} maxLength={1000} defaultValue={values.description} className={inputClass} />
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
        {pending ? "Guardando…" : "Guardar colaborador"}
      </button>
    </form>
  );
}
