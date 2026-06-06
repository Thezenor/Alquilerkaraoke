import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon/50 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-neon text-brand-bg hover:bg-brand-neon-strong shadow-[0_8px_30px_-8px_rgba(34,211,238,0.5)]",
  secondary: "border border-brand-border text-brand-text hover:border-brand-neon/60 hover:text-white",
  ghost: "text-brand-muted hover:text-white",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };
type ButtonAsLink = CommonProps & ComponentPropsWithoutRef<"a"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in rest && rest.href !== undefined) {
    return <a className={classes} {...(rest as ComponentPropsWithoutRef<"a">)} />;
  }
  return <button className={classes} {...(rest as ComponentPropsWithoutRef<"button">)} />;
}
