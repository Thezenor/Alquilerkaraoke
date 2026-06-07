"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { logAudit } from "@/server/audit";
import { rateLimit, isHoneypotFilled } from "@/server/rate-limit";
import { optOutMarketing } from "@/server/gdpr";

export type UnsubscribeState = { status: "idle" | "success" | "error" };

export async function unsubscribeAction(
  _prev: UnsubscribeState,
  formData: FormData,
): Promise<UnsubscribeState> {
  // Anti-spam: honeypot silencioso + rate-limit por IP.
  if (isHoneypotFilled(formData)) return { status: "success" };

  const parsed = z.object({ email: z.email() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`unsubscribe:${ip}`)) return { status: "error" };

  try {
    const affected = await optOutMarketing(parsed.data.email);
    // No revelamos si el email existía (privacidad): siempre confirmamos.
    await logAudit({
      action: "marketing.optout",
      entity: "ContactRequest",
      metadata: { affected },
    });
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}
