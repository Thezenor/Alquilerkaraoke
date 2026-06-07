"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/audit";
import { CONSENT_VERSION } from "@/lib/consent";
import { rateLimit, isHoneypotFilled } from "@/server/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(4000),
  locale: z.string().trim().max(5).optional(),
  // Checkbox HTML: envía "on" si está marcado.
  acceptedTerms: z.literal("on"),
  marketing: z.string().optional(),
});

export type ContactFormState = { status: "idle" | "success" | "error" };

const orNull = (v?: string) => (v && v.length ? v : null);

export async function submitContactRequest(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Anti-spam: honeypot (silencioso) + rate-limit por IP.
  if (isHoneypotFilled(formData)) {
    return { status: "success" };
  }

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error" };
  }

  const d = parsed.data;
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  if (!rateLimit(`contact:${ip ?? "unknown"}`)) {
    return { status: "error" };
  }

  try {
    const created = await prisma.contactRequest.create({
      data: {
        name: d.name,
        email: d.email,
        phone: orNull(d.phone),
        city: orNull(d.city),
        message: d.message,
        locale: orNull(d.locale),
        acceptedTerms: true,
        marketingConsent: d.marketing === "on",
        consentVersion: CONSENT_VERSION,
        consentAt: new Date(),
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
