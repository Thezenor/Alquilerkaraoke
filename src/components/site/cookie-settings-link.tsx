"use client";

import { CONSENT_OPEN_EVENT } from "@/lib/cookie-consent";

/** Reabre el banner de consentimiento de cookies (footer y página de cookies). */
export function CookieSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className={className ?? "text-brand-muted underline underline-offset-2 transition hover:text-brand-neon"}
    >
      {label}
    </button>
  );
}
