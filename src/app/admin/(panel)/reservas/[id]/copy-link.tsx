"use client";

import { useState } from "react";

/** Muestra un enlace y un botón para copiarlo al portapapeles. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-lg border border-brand-border bg-brand-bg px-2.5 py-1.5 text-xs text-brand-muted"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            // sin portapapeles: el usuario puede seleccionar el texto manualmente
          }
        }}
        className="shrink-0 rounded-lg border border-brand-border px-2.5 py-1.5 text-xs text-brand-muted transition hover:border-brand-neon hover:text-brand-neon"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
