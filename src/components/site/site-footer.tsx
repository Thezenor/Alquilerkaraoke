import Link from "next/link";
import { Container } from "@/components/ui/container";

export type FooterSocials = {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  twitter?: string | null;
};

export type FooterLink = { href: string; label: string };

const ICONS: Record<keyof FooterSocials, string> = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38 3.7 3.7 0 0 1-1.38.9c-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.12.32-.27.8-.31 1.7C3.43 8.5 3.43 8.85 3.43 12s0 3.5.07 4.74c.04.9.19 1.38.31 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.12.8.27 1.7.31 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.31.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.12-.32.27-.8.31-1.7.07-1.24.07-1.59.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.31-1.7a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.12-.8-.27-1.7-.31C15.5 4 15.15 4 12 4Zm0 3.05a4.95 4.95 0 1 1 0 9.9 4.95 4.95 0 0 1 0-9.9Zm0 1.8a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3Zm5.15-.9a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z",
  facebook:
    "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z",
  tiktok:
    "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12v-3.2a5.7 5.7 0 0 0-.78-.05 5.74 5.74 0 1 0 5.74 5.74V9.4a7.3 7.3 0 0 0 4.27 1.37V7.66a4.28 4.28 0 0 1-3.25-1.84Z",
  youtube:
    "M23 12s0-3.2-.41-4.73a2.5 2.5 0 0 0-1.76-1.77C19.3 5.1 12 5.1 12 5.1s-7.3 0-8.83.4A2.5 2.5 0 0 0 1.4 7.27C1 8.8 1 12 1 12s0 3.2.41 4.73c.22.84.88 1.5 1.76 1.77 1.53.4 8.83.4 8.83.4s7.3 0 8.83-.4a2.5 2.5 0 0 0 1.76-1.77C23 15.2 23 12 23 12Zm-13 3.5v-7l6 3.5-6 3.5Z",
  twitter:
    "M18.9 2.5h3.3l-7.2 8.2 8.5 11.3h-6.65l-5.2-6.8-5.96 6.8H2.4l7.7-8.8L2 2.5h6.82l4.7 6.2 5.38-6.2Zm-1.16 17.5h1.83L7.3 4.36H5.34L17.74 20Z",
};

function SocialIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function SiteFooter({
  companyName,
  phone,
  phoneHref,
  links,
  socials,
}: {
  companyName: string;
  phone: string;
  phoneHref: string;
  links: FooterLink[];
  socials: FooterSocials;
}) {
  const year = new Date().getFullYear();
  const socialEntries = (Object.keys(ICONS) as (keyof FooterSocials)[])
    .map((k) => ({ key: k, url: socials[k] }))
    .filter((s): s is { key: keyof FooterSocials; url: string } => Boolean(s.url));

  return (
    <footer className="border-t border-brand-border/60 bg-brand-surface">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-neon shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
            {companyName}
          </div>
          <a href={phoneHref} className="mt-3 block text-sm text-brand-muted transition hover:text-white">
            {phone}
          </a>
          {socialEntries.length > 0 && (
            <div className="mt-4 flex gap-3">
              {socialEntries.map((s) => (
                <a
                  key={s.key}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.key}
                  className="text-brand-muted transition hover:text-brand-neon"
                >
                  <SocialIcon d={ICONS[s.key]} />
                </a>
              ))}
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-2 text-sm" aria-label="Enlaces">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-brand-muted transition hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="text-sm text-brand-muted sm:text-right">
          <span>
            © {year} {companyName}
          </span>
        </div>
      </Container>
    </footer>
  );
}
