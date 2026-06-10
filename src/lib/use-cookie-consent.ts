"use client";

import { useSyncExternalStore } from "react";
import {
  CONSENT_CHANGED_EVENT,
  readConsent,
  serializeConsent,
} from "./cookie-consent";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
}

/** Snapshot estable (string) del valor actual de la cookie de consentimiento. */
function getSnapshot(): string {
  const consent = readConsent();
  return consent ? serializeConsent(consent) : "none";
}

/** En SSR no hay cookie accesible: estado neutro (ni banner ni scripts). */
function getServerSnapshot(): string {
  return "ssr";
}

/**
 * Valor reactivo del consentimiento de cookies:
 * - "ssr": render en servidor / primera hidratación.
 * - "none": el visitante aún no ha elegido (mostrar banner).
 * - "analytics=true" | "analytics=false": elección guardada (formato granular).
 */
export function useCookieConsentValue(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
