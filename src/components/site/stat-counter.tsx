"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

/**
 * Contador animado para la fila de stats de la home.
 *
 * - Renderiza el valor final en SSR (SEO y sin JS siempre correcto).
 * - Con JS y sin `prefers-reduced-motion`, anima 0 → valor al entrar en
 *   viewport (IntersectionObserver + requestAnimationFrame, una sola vez).
 */
export function StatCounter({
  value,
  prefix = "",
  suffix = "",
  durationMs = 1400,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / durationMs, 1);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico
          setShown(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        setShown(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref}>
      {prefix}
      {new Intl.NumberFormat(locale).format(shown)}
      {suffix}
    </span>
  );
}
