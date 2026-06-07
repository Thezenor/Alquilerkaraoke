import type { Metadata } from "next";
import Link from "next/link";
import { CustomerForm, type CustomerFormValues } from "../customer-form";

export const metadata: Metadata = {
  title: "Nuevo cliente · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: CustomerFormValues = { email: "", name: "", phone: "", isProfessional: false, discountPercent: "0", notes: "" };

export default function NewCustomerPage() {
  return (
    <div>
      <Link href="/admin/clientes" className="text-sm text-brand-muted transition hover:text-white">← Volver a clientes</Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo cliente</h1>
      <div className="mt-8"><CustomerForm values={empty} /></div>
    </div>
  );
}
