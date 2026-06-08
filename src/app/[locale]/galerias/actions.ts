"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { galleryToken, galleryCookieName, isExpired } from "@/server/galleries";

export type UnlockState = { status: "idle" | "error"; message?: string };

/** Verifica la clave de una galería privada y, si es correcta, concede acceso por cookie. */
export async function unlockGallery(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const locale = String(formData.get("locale") ?? "es");
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!slug || !password) return { status: "error", message: "Introduce la clave." };

  let gallery: { id: string; passwordHash: string | null; expiresAt: Date | null } | null = null;
  try {
    gallery = await prisma.gallery.findFirst({
      where: { slug, isActive: true },
      select: { id: true, passwordHash: true, expiresAt: true },
    });
  } catch {
    return { status: "error", message: "No se pudo verificar la clave." };
  }
  if (!gallery || !gallery.passwordHash || isExpired(gallery)) {
    return { status: "error", message: "Galería no disponible." };
  }

  const ok = await bcrypt.compare(password, gallery.passwordHash);
  if (!ok) return { status: "error", message: "Clave incorrecta." };

  const maxAge = gallery.expiresAt
    ? Math.max(60, Math.floor((gallery.expiresAt.getTime() - Date.now()) / 1000))
    : 60 * 60 * 24 * 7; // 7 días
  const jar = await cookies();
  jar.set(galleryCookieName(gallery.id), galleryToken(gallery.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/${locale}/galerias/${slug}`,
    maxAge,
  });

  redirect(`/${locale}/galerias/${slug}`);
}
