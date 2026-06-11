"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";

export type ProfileFormState = { status: "idle" | "error" | "success"; message?: string };

const profileSchema = z.object({
  name: z.string().trim().max(120, "El nombre no puede superar 120 caracteres."),
});

/** Actualiza los datos propios (nombre). Disponible para cualquier usuario del panel. */
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return { status: "error", message: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name || null },
  });
  await logAudit({
    userId: session.user.id,
    action: "user.self_update",
    entity: "User",
    entityId: session.user.id,
  });

  revalidatePath("/admin/perfil");
  return { status: "success", message: "Datos guardados." };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Introduce tu contraseña actual."),
    newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Repite la nueva contraseña."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "La nueva contraseña y su confirmación no coinciden.",
    path: ["confirmPassword"],
  });

/** Cambio de contraseña propio: exige verificar la contraseña actual. */
export async function changeOwnPassword(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return { status: "error", message: "Sesión no válida. Vuelve a iniciar sesión." };
  }

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return { status: "error", message: "Esta cuenta no tiene contraseña local." };
  }

  const currentOk = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentOk) {
    return { status: "error", message: "La contraseña actual no es correcta." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });
  await logAudit({
    userId: session.user.id,
    action: "user.password_change",
    entity: "User",
    entityId: session.user.id,
  });

  return { status: "success", message: "Contraseña actualizada." };
}
