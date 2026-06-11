"use client";

import { useActionState } from "react";
import { updateProfile, changeOwnPassword, type ProfileFormState } from "./actions";

const initial: ProfileFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

function FormMessage({ state }: { state: ProfileFormState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error" ? "mt-4 text-sm text-red-400" : "mt-4 text-sm text-emerald-300"
      }
    >
      {state.message}
    </p>
  );
}

/** Edición de los datos propios (nombre). */
export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfile, initial);

  return (
    <form action={action}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-name" className="text-brand-text text-sm font-medium">
          Nombre
        </label>
        <input
          id="profile-name"
          name="name"
          defaultValue={name}
          maxLength={120}
          className={inputClass}
        />
      </div>

      <FormMessage state={state} />

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-neon text-brand-bg hover:bg-brand-neon-strong mt-5 rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

/** Cambio de contraseña propio (exige la contraseña actual). */
export function PasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, initial);

  return (
    <form action={action}>
      <div className="grid gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="current-password" className="text-brand-text text-sm font-medium">
            Contraseña actual *
          </label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-brand-text text-sm font-medium">
            Nueva contraseña *
          </label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-brand-text text-sm font-medium">
            Repetir nueva contraseña *
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>

      <FormMessage state={state} />

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-neon text-brand-bg hover:bg-brand-neon-strong mt-5 rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-60"
      >
        {pending ? "Cambiando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
