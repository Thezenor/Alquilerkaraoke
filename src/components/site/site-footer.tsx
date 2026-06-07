import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteFooter({
  companyName,
  phone,
  phoneHref,
  privacyHref,
  privacyLabel,
}: {
  companyName: string;
  phone: string;
  phoneHref: string;
  privacyHref: string;
  privacyLabel: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-border/60 bg-brand-surface">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-semibold text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-neon shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
          {companyName}
        </div>
        <div className="flex flex-col gap-1 text-sm text-brand-muted sm:items-end">
          <a href={phoneHref} className="transition hover:text-white">
            {phone}
          </a>
          <Link href={privacyHref} className="transition hover:text-white">
            {privacyLabel}
          </Link>
          <span>© {year} {companyName}</span>
        </div>
      </Container>
    </footer>
  );
}
