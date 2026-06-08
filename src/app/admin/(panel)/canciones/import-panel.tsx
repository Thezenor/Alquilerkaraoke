"use client";

import { useEffect, useRef, useState } from "react";

type Job = {
  id: string;
  filename: string;
  format: string;
  status: "PENDING" | "RUNNING" | "DONE" | "ERROR";
  processed: number;
  imported: number;
  uniqueCount: number;
  message: string | null;
  createdAt: string;
} | null;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En cola",
  RUNNING: "Procesando…",
  DONE: "Completada",
  ERROR: "Error",
};

export function ImportPanel() {
  const [job, setJob] = useState<Job>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/admin/canciones/import", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { job: Job };
        setJob(data.job);
        return data.job?.status;
      }
    } catch {
      /* ignora */
    }
    return undefined;
  }

  useEffect(() => {
    const tick = async () => {
      const status = await refresh();
      if (status !== "RUNNING" && status !== "PENDING" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    const t = setTimeout(tick, 0); // primer refresco tras montar
    pollRef.current = setInterval(tick, 2500);
    return () => {
      clearTimeout(t);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(`/admin/canciones/import?name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      if (!res.ok) {
        setError(await res.text());
      } else {
        if (fileRef.current) fileRef.current.value = "";
        // reinicia el polling
        if (pollRef.current) clearInterval(pollRef.current);
        await refresh();
        pollRef.current = setInterval(async () => {
          const status = await refresh();
          if (status !== "RUNNING" && status !== "PENDING" && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }, 2500);
      }
    } catch {
      setError("No se pudo subir el fichero.");
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || job?.status === "RUNNING" || job?.status === "PENDING";

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
      <h2 className="text-sm font-semibold text-white">Importar catálogo (.xlsx o .csv)</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Sube el fichero (hasta ~200 MB). Se procesa en segundo plano; puedes salir de la página y volver para ver el avance.
        Reemplaza el catálogo y optimiza al terminar.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.csv"
          disabled={busy}
          className="text-sm text-brand-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-brand-text"
        />
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          className="rounded-lg bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong disabled:opacity-50"
        >
          {uploading ? "Subiendo…" : "Subir e importar"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {job && (
        <div className="mt-4 rounded-lg border border-brand-border bg-brand-bg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-brand-muted">{job.filename}</span>
            <span
              className={
                job.status === "DONE"
                  ? "text-emerald-300"
                  : job.status === "ERROR"
                    ? "text-red-400"
                    : "text-amber-300"
              }
            >
              {STATUS_LABEL[job.status] ?? job.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-muted">
            Filas: {job.processed.toLocaleString("es-ES")} · Importadas: {job.imported.toLocaleString("es-ES")}
            {job.status === "DONE" ? ` · No repetidas: ${job.uniqueCount.toLocaleString("es-ES")}` : ""}
          </p>
          {job.message && <p className="mt-1 text-xs text-red-400">{job.message}</p>}
        </div>
      )}
    </div>
  );
}
