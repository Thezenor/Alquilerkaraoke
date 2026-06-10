import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { TestimonialForm, type TestimonialFormValues } from "../testimonial-form";

export const metadata: Metadata = {
  title: "Nuevo testimonio · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: TestimonialFormValues = {
  authorName: "",
  eventType: "",
  quote: "",
  rating: "5",
  locale: "es",
  sourceUrl: "",
  sortOrder: "0",
  isActive: true,
};

export default async function NewTestimonialPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  return (
    <div>
      <Link href="/admin/testimonios" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a testimonios
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo testimonio</h1>
      <div className="mt-8">
        <TestimonialForm values={empty} />
      </div>
    </div>
  );
}
