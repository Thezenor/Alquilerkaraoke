import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { Icon } from "@/components/admin/icons";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { saveSongBrand, deleteSongBrand, reoptimizeCatalog } from "./actions";
import { ImportPanel } from "./import-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canciones · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const inputCls = "rounded-lg border border-brand-border bg-brand-bg px-2.5 py-1.5 text-sm text-white focus:border-brand-neon focus:outline-none";

export default async function AdminSongsPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const [total, unique, brands] = await Promise.all([
    prisma.song.count(),
    prisma.song.count({ where: { isPrimary: true } }),
    prisma.songBrand.findMany({ orderBy: [{ quality: "desc" }, { name: "asc" }] }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Canciones</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Catálogo, marcas y optimización (deduplicación por calidad de marca).
      </p>

      {/* Estadísticas */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Importadas</p>
          <p className="mt-1 text-2xl font-bold text-white">{total.toLocaleString("es-ES")}</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs uppercase tracking-wide text-brand-muted">No repetidas (visibles)</p>
          <p className="mt-1 text-2xl font-bold text-brand-neon">{unique.toLocaleString("es-ES")}</p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Marcas</p>
          <p className="mt-1 text-2xl font-bold text-white">{brands.length}</p>
        </div>
      </div>

      {/* Importar (subida desde el admin, en segundo plano) */}
      <div className="mt-6">
        <ImportPanel />
      </div>

      {/* Reoptimizar + exportar */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-5">
        <form action={reoptimizeCatalog}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-neon px-4 py-2 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong"
          >
            <Icon name="sparkles" className="h-4 w-4" />
            Reoptimizar catálogo
          </button>
        </form>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- es un route handler de descarga, no una página */}
        <a
          href="/admin/canciones/export?format=csv"
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-text transition hover:border-brand-neon/60"
        >
          <Icon name="file-text" className="h-4 w-4" />
          Exportar CSV
        </a>
        <a
          href="/canciones"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-neon underline"
        >
          Ver catálogo en la web ↗
        </a>
        <p className="w-full text-xs text-brand-muted">
          Tras cambiar la calidad de las marcas, pulsa <strong>Reoptimizar</strong> para recalcular qué versión se muestra.
          El PDF del repertorio se descarga por idioma desde la página pública de canciones.
        </p>
      </div>

      {/* Marcas */}
      <h2 className="mt-8 text-lg font-semibold text-white">Marcas y calidad</h2>
      <p className="mt-1 text-sm text-brand-muted">Mayor calidad = versión preferida cuando una canción se repite.</p>

      <form action={saveSongBrand} className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-brand-border bg-brand-surface p-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-brand-muted">Nueva marca</span>
          <input name="name" required maxLength={120} placeholder="Ej. KaraokeMedia" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-brand-muted">Calidad</span>
          <input name="quality" type="number" min={0} max={1000} defaultValue={0} className={`${inputCls} w-24`} />
        </label>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-brand-text">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-brand-neon" /> Activa
        </label>
        <button type="submit" className="rounded-lg bg-brand-neon px-4 py-1.5 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
          Añadir
        </button>
      </form>

      {brands.length > 0 && (
        <ul className="mt-4 space-y-2">
          {brands.map((b) => (
            <li key={b.id} className="rounded-xl border border-brand-border bg-brand-surface p-3">
              <form action={saveSongBrand} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={b.id} />
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-brand-muted">Nombre</span>
                  <input name="name" defaultValue={b.name} required maxLength={120} className={`${inputCls} w-full`} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-brand-muted">Calidad</span>
                  <input name="quality" type="number" min={0} max={1000} defaultValue={b.quality} className={`${inputCls} w-24`} />
                </label>
                <label className="flex items-center gap-2 pb-1.5 text-sm text-brand-text">
                  <input type="checkbox" name="isActive" defaultChecked={b.isActive} className="h-4 w-4 accent-brand-neon" /> Activa
                </label>
                <button type="submit" className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text transition hover:border-brand-neon/60">
                  Guardar
                </button>
              </form>
              <form action={deleteSongBrand} className="mt-2">
                <input type="hidden" name="id" value={b.id} />
                <ConfirmButton confirmMessage="¿Eliminar esta marca? Las canciones quedarán sin marca." className="text-xs text-brand-muted transition hover:text-red-400 disabled:opacity-50">
                  Eliminar marca
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
