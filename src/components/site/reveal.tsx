"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Envuelve una sección pública con una entrada fade-up al entrar en viewport.
 *
 * Diseño a prueba de fallos: el HTML servido es 100% visible (SEO y sin JS);
 * la clase .reveal (que oculta) se añade solo en cliente, y solo si el usuario
 * no tiene `prefers-reduced-motion: reduce`. Se anima una única vez.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Retardo en ms para escalonar secciones/elementos. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    el.classList.add("reveal");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add("reveal-visible");
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
