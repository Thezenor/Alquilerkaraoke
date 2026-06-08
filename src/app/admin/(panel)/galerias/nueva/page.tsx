import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { GalleryForm, type GalleryFormValues } from "../gallery-form";

export const metadata: Metadata = {
  title: "Nueva galería · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: GalleryFormValues = {
  title: "",
  slug: "",
  description: "",
  coverImageUrl: "",
  expiresAt: "",
  sortOrder: "",
  isListed: false,
  allowDownload: true,
  isActive: true,
  hasPassword: false,
};

export default async function NewGalleryPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  return (
    <div>
      <Link href="/admin/galerias" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a galerías
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nueva galería</h1>
      <p className="mt-1 text-sm text-brand-muted">Tras crearla podrás añadir fotos y vídeos por URL.</p>
      <div className="mt-8">
        <GalleryForm values={empty} />
      </div>
    </div>
  );
}
