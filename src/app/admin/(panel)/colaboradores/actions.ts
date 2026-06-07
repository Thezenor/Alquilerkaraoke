"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { COLLABORATORS_TAG } from "@/server/collaborators";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(120),
  url: z.union([z.literal(""), z.url("URL no válida.")]).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
  sortOrder: z.string().optional(),
  isActive: z.string().optional(),
});

export type CollaboratorFormState = { status: "idle" | "error"; message?: string };

const int = (v?: string) => {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : 0;
};
const orNull = (v?: string) => (v && v.length ? v : null);

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

export async function saveCollaborator(
  _prev: CollaboratorFormState,
  formData: FormData,
): Promise<CollaboratorFormState> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar colaboradores." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos." };
  }
  const d = parsed.data;

  const data = {
    name: d.name,
    url: orNull(d.url),
    logoUrl: orNull(d.logoUrl),
    description: orNull(d.description),
    sortOrder: int(d.sortOrder),
    isActive: d.isActive === "on",
  };

  try {
    if (d.id) {
      await prisma.collaborator.update({ where: { id: d.id }, data });
      await logAudit({ userId, action: "collaborator.update", entity: "Collaborator", entityId: d.id });
    } else {
      const created = await prisma.collaborator.create({ data });
      await logAudit({ userId, action: "collaborator.create", entity: "Collaborator", entityId: created.id });
    }
  } catch {
    return { status: "error", message: "No se pudo guardar el colaborador." };
  }

  updateTag(COLLABORATORS_TAG);
  revalidatePath("/admin/colaboradores");
  redirect("/admin/colaboradores");
}

export async function deleteCollaborator(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.collaborator.delete({ where: { id } });
  await logAudit({ userId, action: "collaborator.delete", entity: "Collaborator", entityId: id });
  updateTag(COLLABORATORS_TAG);
  revalidatePath("/admin/colaboradores");
  redirect("/admin/colaboradores");
}
