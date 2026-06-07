"use client";

import { useActionState } from "react";
import { saveUser, type UserFormState } from "./actions";

const initial: UserFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

export const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "SUPERADMIN", label: "Superadmin" },
  { value: "ADMIN", label: "Administrador" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "TECNICO", label: "Técnico" },
  { value: "COLABORADOR", label: "Colaborador" },
  { value: "CONTABILIDAD", label: "Contabilidad" },
  { value: "SEO_CONTENIDOS", label: "SEO / Contenidos" },
  { value: "ALMACEN", label: "Almacén" },
];

export type UserFormValues = {
  id?: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
};

export function UserForm({ values }: { values: UserFormValues }) {
  const [state, action, pending] = useActionState(saveUser, initial);
  const isNew = !values.id;

  return (
    <form action={action} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-brand-text">Nombre</label>
          <input id="name" name="name" defaultValue={values.name} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-brand-text">Email *</label>
          <input id="email" name="email" type="email" required defaultValue={values.email} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="password" className="text-sm font-medium text-brand-text">
            {isNew ? "Contraseña inicial *" : "Nueva contraseña"}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required={isNew}
            placeholder={isNew ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiarla"}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-brand-text">Roles</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-brand-muted">
              <input
                type="checkbox"
                name="roles"
                value={r.value}
                defaultChecked={values.roles.includes(r.value)}
                className="h-4 w-4 accent-brand-neon"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 flex items-center gap-2 text-sm text-brand-text">
        <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 accent-brand-neon" />
        Activo (puede iniciar sesión)
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-full bg-brand-neon px-6 py-2.5 font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar usuario"}
      </button>
    </form>
  );
}
