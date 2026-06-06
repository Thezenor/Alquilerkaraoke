"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(4000),
  locale: z.string().trim().max(5).optional(),
});

export type ContactFormState = { status: "idle" | "success" | "error" };

const orNull = (v?: string) => (v && v.length ? v : null);

export async function submitContactRequest(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error" };
  }

  const d = parsed.data;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  try {
    const created = await prisma.contactRequest.create({
      data: {
        name: d.name,
        email: d.email,
        phone: orNull(d.phone),
        city: orNull(d.city),
        message: d.message,
        locale: orNull(d.locale),
        ip,
        userAgent,
      },
    });

    await logAudit({
      action: "contact.create",
      entity: "ContactRequest",
      entityId: created.id,
      metadata: { email: d.email },
    });

    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}
