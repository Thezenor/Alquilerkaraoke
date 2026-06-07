import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { Icon, type IconName } from "@/components/admin/icons";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Dashboard · Panel Alquiler Karaoke",
  robots: { index: false, follow: false },
};

function KpiCard({
  href,
  label,
  value,
  icon,
  featured,
}: {
  href: string;
  label: string;
  value: number;
  icon: IconName;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition",
        featured
          ? "border-brand-neon/40 bg-brand-surface shadow-[var(--shadow-neon)]"
          : "border-brand-border bg-brand-surface hover:border-brand-neon/40",
      )}
    >
      {featured && (
        <span className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-brand-neon/10 blur-2xl" />
      )}
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-xs font-medium tracking-wide uppercase", featured ? "text-brand-neon" : "text-brand-muted")}>
          {label}
        </span>
        <Icon name={icon} className={cn("h-5 w-5", featured ? "text-brand-neon" : "text-brand-muted")} />
      </div>
      <p className={cn("mt-2 text-3xl font-bold text-white tabular-nums", featured && "text-glow")}>{value}</p>
    </Link>
  );
}

function Panel({ title, href, cta, children }: { title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface">
      <header className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <h2 className="font-semibold text-white">{title}</h2>
        <Link href={href} className="text-sm text-brand-neon transition hover:text-brand-neon-strong">
          {cta} →
        </Link>
      </header>
      <div className="divide-y divide-brand-border">{children}</div>
    </section>
  );
}

const QUICK_ACTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin/clientes/nuevo", label: "Nuevo cliente", icon: "user-plus" },
  { href: "/admin/packs/nuevo", label: "Nuevo pack", icon: "plus" },
  { href: "/admin/recargos", label: "Recargos y fechas", icon: "percent" },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pending, monthCount, newLeads, proCount, upcoming, recentBookings, recentLeads] = await Promise.all([
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.contactRequest.count({ where: { status: "NEW" } }),
    prisma.customer.count({ where: { isProfessional: true } }),
    prisma.booking.count({ where: { status: "CONFIRMED", eventDate: { gte: now } } }),
    prisma.booking.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">
        Hola{session?.user?.name ? `, ${session.user.name}` : ""}.
      </h1>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard href="/admin/reservas" label="Reservas pendientes" value={pending} icon="calendar-check" featured />
        <KpiCard href="/admin/reservas" label="Reservas del mes" value={monthCount} icon="calendar" />
        <KpiCard href="/admin/solicitudes" label="Leads sin gestionar" value={newLeads} icon="inbox" />
        <KpiCard href="/admin/clientes" label="Clientes profesionales" value={proCount} icon="users" />
        <KpiCard href="/admin/calendario" label="Próximos eventos" value={upcoming} icon="sparkles" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Reservas pendientes" href="/admin/reservas" cta="Ver todas">
            {recentBookings.length === 0 ? (
              <p className="px-4 py-6 text-sm text-brand-muted">Nada pendiente. 🎉</p>
            ) : (
              recentBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/reservas/${b.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-brand-surface-2"
                >
                  <span className="min-w-0 truncate text-brand-text">
                    {b.name} <span className="text-brand-muted">· {b.packName}</span>
                  </span>
                  <span className="shrink-0 font-medium text-white tabular-nums">{formatCents(b.total)}</span>
                </Link>
              ))
            )}
          </Panel>

          <Panel title="Últimos leads" href="/admin/solicitudes" cta="Ver todos">
            {recentLeads.length === 0 ? (
              <p className="px-4 py-6 text-sm text-brand-muted">Sin solicitudes todavía.</p>
            ) : (
              recentLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/solicitudes/${l.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-brand-surface-2"
                >
                  <span className="min-w-0 truncate text-brand-text">
                    {l.name} <span className="text-brand-muted">· {l.email}</span>
                  </span>
                  <span className="shrink-0 text-xs text-brand-muted">
                    {l.createdAt.toLocaleDateString("es-ES")}
                  </span>
                </Link>
              ))
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <h2 className="mb-3 font-semibold text-white">Acciones rápidas</h2>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-surface-2 px-3 py-3 text-sm text-brand-text transition hover:border-brand-neon/50 hover:text-white"
                >
                  <Icon name={a.icon} className="h-5 w-5 text-brand-neon" />
                  {a.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
