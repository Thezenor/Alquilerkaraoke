"use client";

import { useFormStatus } from "react-dom";

/** Botón de envío que pide confirmación antes de ejecutar la acción del form. */
export function ConfirmButton({
  children,
  confirmMessage,
  className,
}: {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
