"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
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
