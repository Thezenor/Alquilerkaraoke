"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "./icons";

export type FilterChip = { value: string; label: string };

/**
 * Barra de búsqueda + chips de filtro para listados admin.
 * Actualiza los searchParams (búsqueda con debounce) y reinicia la paginación.
 */
export function ListControls({
  chips,
  filterParam = "status",
  placeholder = "Buscar…",
}: {
  chips?: FilterChip[];
  filterParam?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const active = params.get(filterParam) ?? "";
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page"); // cambiar filtro/búsqueda vuelve a la primera página
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearch(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam({ q: value || null }), 350);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className="w-full rounded-lg border border-brand-border bg-brand-surface py-2 pr-3 pl-9 text-sm text-white placeholder:text-brand-muted/60 focus:border-brand-neon focus:outline-none"
        />
      </div>

      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Chip label="Todos" activeValue={active} value="" onClick={() => setParam({ [filterParam]: null })} />
          {chips.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              value={c.value}
              activeValue={active}
              onClick={() => setParam({ [filterParam]: c.value })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  value,
  activeValue,
  onClick,
}: {
  label: string;
  value: string;
  activeValue: string;
  onClick: () => void;
}) {
  const isActive = activeValue === value;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        isActive
          ? "border-brand-neon bg-brand-neon/15 text-brand-neon"
          : "border-brand-border text-brand-muted hover:border-brand-neon/50 hover:text-white",
      )}
    >
      {label}
    </button>
  );
}
