"use client";

import { useActionState } from "react";
import { saveUser, type UserFormState } from "./actions";

const initial: UserFormState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30";

// Descripciones según los permisos reales (nav-config + guards de cada módulo).
export const ROLE_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: "SUPERADMIN",
    label: "Superadmin",
    description: "Acceso total: todos los módulos del panel y el único que gestiona usuarios.",
  },
  {
    value: "ADMIN",
    label: "Administrador",
    description:
      "Todo el panel (operativa, catálogo, contenido, precios, IA y configuración), salvo gestión de usuarios.",
  },
  {
    value: "COMERCIAL",
    label: "Comercial",
    description: "Gestión comercial: reservas, clientes, solicitudes y presupuestos manuales.",
  },
  {
    value: "TECNICO",
    label: "Técnico",
    description:
      "Acceso al panel (dashboard y consulta); sus módulos de gestión llegarán en fases posteriores.",
  },
  {
    value: "COLABORADOR",
    label: "Colaborador",
    description: "Sin acceso al panel admin; tendrá su propia área externa en fases posteriores.",
  },
  {
    value: "CONTABILIDAD",
    label: "Contabilidad",
    description:
      "Acceso al panel (dashboard y consulta); pagos y facturación llegarán en fases posteriores.",
  },
  {
    value: "SEO_CONTENIDOS",
    label: "SEO / Contenidos",
    description: "Contenido y SEO: blog, ciudades, eventos, galerías y subida de imágenes.",
  },
  {
    value: "ALMACEN",
    label: "Almacén",
    description:
      "Acceso al panel (dashboard y consulta); gestión de material llegará en fases posteriores.",
  },
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
          <label htmlFor="name" className="text-brand-text text-sm font-medium">
            Nombre
          </label>
          <input id="name" name="name" defaultValue={values.name} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-brand-text text-sm font-medium">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={values.email}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="password" className="text-brand-text text-sm font-medium">
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
        <legend className="text-brand-text text-sm font-medium">Roles</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map((r) => (
            <div key={r.value}>
              <label className="text-brand-text flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="roles"
                  value={r.value}
                  defaultChecked={values.roles.includes(r.value)}
                  className="accent-brand-neon h-4 w-4"
                />
                {r.label}
              </label>
              <p className="text-brand-muted mt-0.5 pl-6 text-xs">{r.description}</p>
            </div>
          ))}
        </div>
      </fieldset>

      <label className="text-brand-text mt-5 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={values.isActive}
          className="accent-brand-neon h-4 w-4"
        />
        Activo (puede iniciar sesión)
      </label>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 text-sm text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand-neon text-brand-bg hover:bg-brand-neon-strong mt-6 rounded-full px-6 py-2.5 font-semibold transition disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar usuario"}
      </button>
    </form>
  );
}
