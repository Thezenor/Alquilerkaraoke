import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ImageUpload } from "@/components/admin/image-upload";
import { GalleryForm, type GalleryFormValues } from "../gallery-form";
import { deleteGallery, addGalleryItem, deleteGalleryItem } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar galería · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const inputClass =
  "rounded-lg border border-brand-border bg-brand-bg px-2.5 py-1.5 text-sm text-white outline-none focus:border-brand-neon";
const toInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const { id } = await params;
  const g = await prisma.gallery.findUnique({
    where: { id },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!g) notFound();

  const values: GalleryFormValues = {
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description ?? "",
    coverImageUrl: g.coverImageUrl ?? "",
    expiresAt: toInput(g.expiresAt),
    sortOrder: String(g.sortOrder),
    isListed: g.isListed,
    allowDownload: g.allowDownload,
    isActive: g.isActive,
    hasPassword: g.passwordHash != null,
  };

  return (
    <div>
      <Link href="/admin/galerias" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a galerías
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Editar: {g.title}</h1>
        <a href={`/es/galerias/${g.slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-brand-neon underline-offset-2 hover:underline">
          Ver en la web ↗
        </a>
      </div>

      <div className="mt-8">
        <GalleryForm values={values} />
      </div>

      {/* Elementos */}
      <h2 className="mt-12 text-lg font-semibold text-white">Fotos y vídeos ({g.items.length})</h2>
      <form action={addGalleryItem} className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-4">
        <input type="hidden" name="galleryId" value={g.id} />
        <ImageUpload name="url" label="Sube una foto (o pega la URL de un vídeo)" />
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-brand-muted">Tipo</span>
            <select name="type" className={inputClass}>
              <option value="IMAGE">Imagen</option>
              <option value="VIDEO">Vídeo</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-brand-muted">Miniatura del vídeo (opcional)</span>
            <input name="thumbnailUrl" placeholder="https://… (recom. para vídeo)" className={`${inputClass} w-full`} />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-brand-muted">Pie (opcional)</span>
            <input name="caption" maxLength={300} className={`${inputClass} w-full`} />
          </label>
          <button type="submit" className="rounded-lg bg-brand-neon px-4 py-1.5 text-sm font-semibold text-brand-bg transition hover:bg-brand-neon-strong">
            Añadir
          </button>
        </div>
      </form>

      {g.items.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {g.items.map((it) => (
            <li key={it.id} className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface-2">
              <div className="relative aspect-square">
                {it.type === "VIDEO" ? (
                  <div className="flex h-full w-full items-center justify-center bg-black/40 text-2xl">▶</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- previsualización admin
                  <img src={it.thumbnailUrl ?? it.url} alt={it.caption ?? ""} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-brand-muted">{it.caption || it.type}</span>
                <form action={deleteGalleryItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <input type="hidden" name="galleryId" value={g.id} />
                  <ConfirmButton confirmMessage="¿Eliminar este elemento?" className="text-xs text-brand-muted transition hover:text-red-400">
                    Borrar
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Eliminar galería */}
      <div className="mt-12 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar galería</h2>
        <p className="mt-1 text-sm text-brand-muted">Se borrarán también todos sus elementos. No se puede deshacer.</p>
        <form action={deleteGallery} className="mt-3">
          <input type="hidden" name="id" value={g.id} />
          <ConfirmButton confirmMessage="¿Eliminar esta galería y todo su contenido?" className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
