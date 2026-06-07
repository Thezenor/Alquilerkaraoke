import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { CustomerForm, type CustomerFormValues } from "../customer-form";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Editar cliente · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.COMERCIAL);
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { bookings: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!customer) notFound();

  const values: CustomerFormValues = {
    id: customer.id,
    email: customer.email,
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    isProfessional: customer.isProfessional,
    discountPercent: String(customer.discountPercent),
    notes: customer.notes ?? "",
  };

  return (
    <div>
      <Link href="/admin/clientes" className="text-sm text-brand-muted transition hover:text-white">← Volver a clientes</Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {customer.name || customer.email}</h1>
      <div className="mt-8"><CustomerForm values={values} /></div>

      {customer.bookings.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">Reservas del cliente</h2>
          <ul className="mt-4 divide-y divide-brand-border overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
            {customer.bookings.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/reservas/${b.id}`} className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-brand-surface-2">
                  <span className="text-brand-text">{b.packName} · {b.createdAt.toLocaleDateString("es-ES")}</span>
                  <span className="font-medium text-white">{formatCents(b.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
