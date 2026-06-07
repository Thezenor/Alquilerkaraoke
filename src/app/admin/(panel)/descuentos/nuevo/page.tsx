import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { DiscountForm, type DiscountFormValues } from "../code-form";

export const metadata: Metadata = {
  title: "Nuevo código · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: DiscountFormValues = {
  code: "",
  valueType: "PERCENT",
  value: "",
  maxUses: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

export default async function NewDiscountPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  return (
    <div>
      <Link href="/admin/descuentos" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a descuentos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo código de descuento</h1>
      <div className="mt-8">
        <DiscountForm values={empty} />
      </div>
    </div>
  );
}
