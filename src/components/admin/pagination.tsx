import Link from "next/link";
import { Icon } from "./icons";
import { cn } from "@/lib/cn";

/**
 * Paginación basada en enlaces (server component). `makeHref` construye la URL
 * preservando los filtros actuales.
 */
export function Pagination({
  page,
  totalPages,
  total,
  makeHref,
}: {
  page: number;
  totalPages: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return total > 0 ? (
      <p className="mt-4 text-center text-xs text-brand-muted">{total} resultados</p>
    ) : null;
  }

  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Paginación">
      <PageLink href={makeHref(page - 1)} disabled={page <= 1} label="Anterior" icon="chevron-left" />
      <span className="text-xs text-brand-muted">
        Página {page} de {totalPages} · {total} resultados
      </span>
      <PageLink href={makeHref(page + 1)} disabled={page >= totalPages} label="Siguiente" icon="chevron-right" iconAfter />
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  icon,
  iconAfter,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: "chevron-left" | "chevron-right";
  iconAfter?: boolean;
}) {
  const cls = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition";
  if (disabled) {
    return (
      <span className={cn(cls, "cursor-not-allowed border-brand-border text-brand-muted/40")} aria-disabled>
        {!iconAfter && <Icon name={icon} className="h-4 w-4" />}
        {label}
        {iconAfter && <Icon name={icon} className="h-4 w-4" />}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(cls, "border-brand-border text-brand-muted hover:border-brand-neon hover:text-brand-neon")}>
      {!iconAfter && <Icon name={icon} className="h-4 w-4" />}
      {label}
      {iconAfter && <Icon name={icon} className="h-4 w-4" />}
    </Link>
  );
}
