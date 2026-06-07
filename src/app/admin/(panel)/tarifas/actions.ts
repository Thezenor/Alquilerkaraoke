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

export async function upsertSupplement(formData: FormData): Promise<void> {
  let userId: string | undefined;
  try {
    userId = (await ensureRole()).user.id;
  } catch {
    return;
  }
  const province = String(formData.get("province") ?? "").trim();
  if (!province) return;
  const amount = eurosToCents(String(formData.get("amount") ?? ""));

  await prisma.provinceSupplement.upsert({
    where: { province },
    update: { amount, isActive: true },
    create: { province, amount },
  });
  await logAudit({ userId, action: "supplement.upsert", entity: "ProvinceSupplement", metadata: { province, amount } });
  updateTag(PRICING_TAG);
  revalidatePath("/admin/tarifas");
}

export async function deleteSupplement(formData: FormData): Promise<void> {
  try {
    await ensureRole();
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.provinceSupplement.delete({ where: { id } }).catch(() => {});
  updateTag(PRICING_TAG);
  revalidatePath("/admin/tarifas");
}
