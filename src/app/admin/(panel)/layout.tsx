import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { canAccessAdmin } from "@/lib/auth-roles";
import { AdminShell } from "@/components/admin/admin-shell";
import { NAV_GROUPS, filterNavByRoles } from "@/components/admin/nav-config";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Defensa en profundidad: además del middleware, verificamos en servidor.
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user.roles)) {
    redirect("/admin/login");
  }

  const groups = filterNavByRoles(NAV_GROUPS, session.user.roles);

  return (
    <div className="min-h-dvh bg-brand-bg text-brand-text">
      <AdminShell groups={groups} userEmail={session.user.email ?? ""}>
        {children}
      </AdminShell>
    </div>
  );
}
