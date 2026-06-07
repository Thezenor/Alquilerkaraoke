"use server";

import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth/guards";
import { logAudit } from "@/server/audit";
import { eurosToCents } from "@/lib/money";
import { PRICING_TAG } from "@/server/pricing";
import { Role } from "@/generated/prisma/enums";

async function ensureRole() {
  return requireRole(Role.SUPERADMIN, Role.ADMIN);
}

export async function updateVat(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const vat = z.coerce.number().int().min(0).max(100).safeParse(formData.get("vatPercent"));
  if (!vat.success) return;

  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    update: { vatPercent: vat.data },
    create: { id: "default", vatPercent: vat.data },
  });
  await logAudit({ userId, action: "pricing.vat", entity: "PricingConfig", metadata: { vat: vat.data } });
  updateTag(PRICING_TAG);
  revalidatePath("/admin/tarifas");
}

export async function updateZone(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supplement = eurosToCents(String(formData.get("supplement") ?? ""));

  await prisma.tariffZone.update({
    where: { id },
    data: { supplement, pendingConfig: false },
  });
  await logAudit({ userId, action: "zone.update", entity: "TariffZone", entityId: id, metadata: { supplement } });
  updateTag(PRICING_TAG);
  revalidatePath("/admin/tarifas");
}
