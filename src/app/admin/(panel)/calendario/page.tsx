import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "calendario · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default function PlaceholderPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white capitalize">calendario</h1>
      <div className="mt-8 rounded-2xl border border-dashed border-brand-border bg-brand-surface/50 p-10 text-center">
        <p className="text-brand-muted">Módulo en construcción.</p>
        <p className="mt-1 text-sm text-brand-muted">
          El calendario de fechas con recargo llega en el siguiente bloque del rediseño.
        </p>
      </div>
    </div>
  );
}
