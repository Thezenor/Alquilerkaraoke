"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { anonymizeContact } from "@/server/gdpr";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "IN_PROGRESS", "ANSWERED", "ARCHIVED"]),
  response: z.string().trim().max(4000).optional(),
});

export type RespondState = { status: "idle" | "success" | "error"; message?: string };

export async function respondContactRequest(
  _prev: RespondState,
  formData: FormData,
): Promise<RespondState> {
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar solicitudes." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Datos no válidos." };
  }

  const { id, status, response } = parsed.data;
  const hasResponse = !!response && response.length > 0;

  await prisma.contactRequest.update({
    where: { id },
    data: {
      status,
      ...(hasResponse
        ? { response, respondedById: userId, respondedAt: new Date() }
        : {}),
    },
  });

  await logAudit({
    userId,
    action: "contact.respond",
    entity: "ContactRequest",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${id}`);

  return { status: "success", message: "Solicitud actualizada." };
}

/** RGPD — derecho de supresión: anonimiza la PII de la solicitud y la archiva. */
export async function anonymizeContactAction(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN)).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await anonymizeContact(id);
  await logAudit({ userId, action: "contact.anonymize", entity: "ContactRequest", entityId: id });
  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${id}`);
}

/** Borra una solicitud de contacto (lead) por completo. Solo SUPERADMIN/ADMIN. */
export async function deleteContactRequest(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await requireRole(Role.SUPERADMIN, Role.ADMIN)).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  try {
    await prisma.contactRequest.delete({ where: { id } });
    await logAudit({ userId, action: "contact.delete", entity: "ContactRequest", entityId: id });
  } catch {
    return;
  }
  revalidatePath("/admin/solicitudes");
  redirect("/admin/solicitudes");
}
