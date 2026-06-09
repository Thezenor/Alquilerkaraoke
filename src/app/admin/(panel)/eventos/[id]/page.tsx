import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EventForm, type EventFormValues } from "../event-form";
import { deleteEventType } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar evento · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  const { id } = await params;
  const e = await prisma.eventType.findUnique({ where: { id } });
  if (!e) notFound();

  const features = ((e.features as string[] | null) ?? []).join("\n");
  const faq = ((e.faq as { q: string; a: string }[] | null) ?? []).map((f) => `${f.q} | ${f.a}`).join("\n");

  const values: EventFormValues = {
    id: e.id,
    name: e.name,
    slug: e.slug,
    shortDescription: e.shortDescription ?? "",
    intro: e.intro ?? "",
    description: e.description ?? "",
    features,
    faq,
    heroImageUrl: e.heroImageUrl ?? "",
    metaTitle: e.metaTitle ?? "",
    metaDescription: e.metaDescription ?? "",
    sortOrder: String(e.sortOrder),
    isActive: e.isActive,
  };

  return (
    <div>
      <Link href="/admin/eventos" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a eventos
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">Editar: {e.name}</h1>
        <a href={`/es/eventos/${e.slug}`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-brand-neon underline-offset-2 hover:underline">
          Ver en la web ↗
        </a>
      </div>
      <div className="mt-8">
        <EventForm values={values} />
      </div>

      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h2 className="text-sm font-semibold text-red-300">Eliminar evento</h2>
        <p className="mt-1 text-sm text-brand-muted">Esta acción no se puede deshacer. La página dejará de existir.</p>
        <form action={deleteEventType} className="mt-3">
          <input type="hidden" name="id" value={e.id} />
          <ConfirmButton confirmMessage="¿Eliminar este tipo de evento?" className="rounded-lg border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">
            Eliminar
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
