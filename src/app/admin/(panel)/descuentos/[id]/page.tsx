import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToInput } from "@/lib/money";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { DiscountForm, type DiscountFormValues } from "../code-form";
import { deleteDiscountCode } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: "Editar código · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const toInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const c = await prisma.discountCode.findUnique({ where: { id } });
  if (!c) notFound();

  const values: DiscountFormValues = {
    id: c.id,
    code: c.code,
    valueType: c.valueType,
    value: c.valueType === "PERCENT" ? String(c.value) : centsToInput(c.value),
    maxUses: c.maxUses != null ? String(c.maxUses) : "",
    validFrom: toInput(c.validFrom),
    validUntil: toInput(c.validUntil),
    isActive: c.isActive,
  };

  return (
    <div>
      <Link href="/admin/descuentos" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a descuentos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {c.code}</h1>
      <p className="mt-1 text-sm text-brand-muted">Usado {c.usedCount} {c.usedCount === 1 ? "vez" : "veces"}.</p>
      <div className="mt-8">
        <DiscountForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar código</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer.</p>
        <form action={deleteDiscountCode} className="mt-3">
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar este código de descuento?"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
