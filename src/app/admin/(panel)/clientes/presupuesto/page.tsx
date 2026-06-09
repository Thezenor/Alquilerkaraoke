import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { getProvinces, getPricingConfig } from "@/server/pricing";
import { centsToInput } from "@/lib/money";
import { QuoteBuilder, type PackOption, type ProvinceOption, type QuotePrefill } from "./quote-builder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crear presupuesto · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function NuevoPresupuestoPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
  const sp = await searchParams;

  const [packsRaw, provinces, pricing, customer] = await Promise.all([
    prisma.pack.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getProvinces(),
    getPricingConfig(),
    sp.customerId ? prisma.customer.findUnique({ where: { id: sp.customerId } }) : Promise.resolve(null),
  ]);

  const packs: PackOption[] = packsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? p.shortDescription ?? "",
    priceInput: centsToInput(p.basePrice),
    includedHours: p.includedHours,
  }));

  const provinceOptions: ProvinceOption[] = provinces.map((p) => ({
    name: p.name,
    supplement: p.zone && p.zone.isActive ? p.zone.supplement : 0,
  }));

  const prefill: QuotePrefill = customer
    ? { name: customer.name ?? "", email: customer.email, phone: customer.phone ?? "" }
    : { name: "", email: "", phone: "" };

  return (
    <div>
      <Link href="/admin/clientes" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a clientes
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Crear presupuesto</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Elige la fecha y la provincia, añade productos (se rellenan desde el sistema y puedes editar
        descripción y precio) y genera el PDF. El cliente queda dado de alta con su email y teléfono.
      </p>
      <div className="mt-8">
        <QuoteBuilder
          packs={packs}
          provinces={provinceOptions}
          vatPercent={pricing?.vatPercent ?? 21}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
