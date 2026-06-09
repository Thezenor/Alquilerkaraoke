import type { Metadata } from "next";
import Link from "next/link";
import { pageRequireRole } from "@/server/auth/guards";
import { Role } from "@/generated/prisma/enums";
import { EventForm, type EventFormValues } from "../event-form";

export const metadata: Metadata = {
  title: "Nuevo evento · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

const empty: EventFormValues = {
  name: "",
  slug: "",
  shortDescription: "",
  intro: "",
  description: "",
  features: "",
  faq: "",
  heroImageUrl: "",
  metaTitle: "",
  metaDescription: "",
  sortOrder: "",
  isActive: true,
};

export default async function NewEventPage() {
  await pageRequireRole(Role.SUPERADMIN, Role.ADMIN, Role.SEO_CONTENIDOS);
  return (
    <div>
      <Link href="/admin/eventos" className="text-sm text-brand-muted transition hover:text-white">
        ← Volver a eventos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Nuevo tipo de evento</h1>
      <p className="mt-1 text-sm text-brand-muted">Tras crearlo podrás generar el contenido con IA y revisarlo.</p>
      <div className="mt-8">
        <EventForm values={empty} />
      </div>
    </div>
  );
}
