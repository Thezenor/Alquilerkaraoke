"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "REJECTED", "CANCELLED"]),
  adminNote: z.string().trim().max(4000).optional(),
});

export type BookingState = { status: "idle" | "success" | "error"; message?: string };

export async function updateBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  let userId: string | undefined;
  try {
    const session = await requireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
    userId = session.user.id;
  } catch {
    return { status: "error", message: "No tienes permisos para gestionar reservas." };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Datos no válidos." };
  const { id, status, adminNote } = parsed.data;

  await prisma.booking.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote && adminNote.length ? adminNote : null,
      handledById: userId,
      handledAt: new Date(),
    },
  });

  await logAudit({
    userId,
    action: "booking.update",
    entity: "Booking",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${id}`);
  return { status: "success", message: "Reserva actualizada." };
}
