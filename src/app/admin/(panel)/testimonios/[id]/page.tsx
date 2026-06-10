import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { TestimonialForm, type TestimonialFormValues } from "../testimonial-form";
import { deleteTestimonial } from "../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: "Editar testimonio · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN);
  const { id } = await params;
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (!t) notFound();

  const values: TestimonialFormValues = {
    id: t.id,
    authorName: t.authorName,
    eventType: t.eventType ?? "",
    quote: t.quote,
    rating: String(t.rating),
    locale: t.locale,
    sourceUrl: t.sourceUrl ?? "",
    sortOrder: String(t.sortOrder),
    isActive: t.isActive,
  };

  return (
    <div>
      <Link href="/admin/testimonios" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a testimonios
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Editar: {t.authorName}</h1>
      <div className="mt-8">
        <TestimonialForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar testimonio</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer.</p>
        <form action={deleteTestimonial} className="mt-3">
          <input type="hidden" name="id" value={t.id} />
          <ConfirmButton
            confirmMessage="¿Eliminar este testimonio?"
            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
