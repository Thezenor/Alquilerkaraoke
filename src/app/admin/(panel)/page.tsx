import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Dashboard · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">
        Bienvenido{user?.name ? `, ${user.name}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        Roles: {user?.roles?.join(", ") || "—"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/configuracion"
          className="rounded-xl border border-brand-border bg-brand-surface p-5 transition hover:border-brand-neon/60"
        >
          <h2 className="font-semibold text-white">Configuración de empresa</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Datos de contacto y branding que se muestran en la web pública.
          </p>
        </Link>

        <div className="rounded-xl border border-dashed border-brand-border/60 p-5 text-brand-muted">
          <h2 className="font-semibold">Más módulos</h2>
          <p className="mt-1 text-sm">Packs, reservas, clientes… llegan en próximas fases.</p>
        </div>
      </div>
    </div>
  );
}
