"use client";

import { useRef, useState } from "react";

/**
 * Campo de imagen: sube un archivo (se optimiza a WebP en el servidor) o pega una URL.
 * El valor final viaja en un input con `name`, así que se envía con el formulario.
 */
export function ImageUpload({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/admin/media/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) setUrl(data.url);
      else setError(data.error ?? "No se pudo subir.");
    } catch {
      setError("No se pudo subir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-brand-text">{label}</span>
      <div className="flex items-start gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- previsualización admin
          <img src={url} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-brand-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-brand-border text-brand-muted/50">♪</div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Sube un archivo o pega una URL (https://…)"
            className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition focus:border-brand-neon focus:ring-2 focus:ring-brand-neon/30"
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-full border border-brand-neon/50 px-3 py-1 text-xs font-medium text-brand-neon transition hover:bg-brand-neon/10 disabled:opacity-50"
            >
              {busy ? "Subiendo…" : "Subir imagen"}
            </button>
            {url && (
              <button type="button" onClick={() => setUrl("")} className="text-xs text-brand-muted transition hover:text-red-400">
                Quitar
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
