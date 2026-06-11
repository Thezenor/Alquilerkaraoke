"use client";

import { useActionState } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteUser, type UserFormState } from "./actions";

const initial: UserFormState = { status: "idle" };

/** Borrado de usuario con confirmación; muestra el error de las salvaguardas. */
export function DeleteUserForm({ userId, userLabel }: { userId: string; userLabel: string }) {
  const [state, action] = useActionState(deleteUser, initial);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={userId} />
      {state.status === "error" && state.message && (
        <p role="alert" className="mb-3 text-sm text-red-400">
          {state.message}
        </p>
      )}
      <ConfirmButton
        confirmMessage={`¿Eliminar definitivamente al usuario "${userLabel}"? Esta acción no se puede deshacer.`}
        className="rounded-full border border-red-500/40 px-5 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
      >
        Eliminar usuario
      </ConfirmButton>
    </form>
  );
}
