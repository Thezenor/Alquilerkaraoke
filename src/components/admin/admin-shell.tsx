"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "./icons";
import { isItemActive, isGroupActive } from "./nav-active";
import type { NavGroup } from "./nav-config";
import { SignOutButton } from "@/components/sign-out-button";

function NavGroups({
  groups,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Navegación del panel">
      {groups.map((group) => {
        const groupActive = isGroupActive(pathname, group);
        return (
          <div key={group.label} className="mb-5">
            {!collapsed && (
              <p
                className={cn(
                  "px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase",
                  groupActive ? "text-brand-neon/80" : "text-brand-muted/70",
                )}
              >
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        collapsed && "justify-center",
                        active
                          ? "bg-brand-surface-2 font-medium text-white"
                          : "text-brand-muted hover:bg-brand-surface-2/60 hover:text-white",
                      )}
                    >
                      {active && (
                        <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r bg-brand-neon shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      )}
                      <Icon name={item.icon} className={cn("h-5 w-5 shrink-0", active && "text-brand-neon")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  groups,
  userEmail,
  children,
}: {
  groups: NavGroup[];
  userEmail: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar escritorio */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-brand-border bg-brand-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-brand-border px-4">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-neon shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          {!collapsed && <span className="truncate font-bold text-white">Alquiler Karaoke</span>}
        </div>
        <NavGroups groups={groups} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="flex h-12 items-center justify-center border-t border-brand-border text-brand-muted transition hover:text-brand-neon"
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} className="h-5 w-5" />
        </button>
      </aside>

      {/* Drawer móvil */}
      <div className={cn("lg:hidden", !drawerOpen && "pointer-events-none")} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          tabIndex={-1}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-brand-border bg-brand-surface shadow-2xl outline-none transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-brand-border px-4">
            <span className="font-bold text-white">Alquiler Karaoke</span>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar menú"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted hover:bg-brand-surface-2 hover:text-white"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
          </div>
          <NavGroups groups={groups} onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Columna de contenido */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-60",
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-brand-border bg-brand-surface/95 px-4 backdrop-blur lg:h-16 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-surface-2 hover:text-white lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="h-2 w-2 rounded-full bg-brand-neon shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
            <span className="font-semibold text-white">Panel</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-brand-muted sm:inline">{userEmail}</span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
