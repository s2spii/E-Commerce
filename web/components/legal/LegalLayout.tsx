'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SERVICE_LINKS, LEGAL_LINKS } from '@/lib/nav';

interface LegalLayoutProps {
  title: string;
  updatedAt?: string;
  intro?: string;
  /** When true, content is rendered without the `.legal-prose` typography. */
  bare?: boolean;
  children: ReactNode;
}

/** Two-column shell for service & legal pages: sticky nav + prose content. */
export function LegalLayout({ title, updatedAt, intro, bare, children }: LegalLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container-luxe py-16">
      <header className="animate-fade-up mb-12 max-w-3xl">
        <span className="eyebrow">Maison Luma</span>
        <h1 className="mt-4 text-4xl sm:text-5xl">{title}</h1>
        {updatedAt ? (
          <p className="mt-3 text-xs uppercase tracking-widest text-muted">
            Dernière mise à jour : {updatedAt}
          </p>
        ) : null}
        {intro ? <p className="mt-5 text-sm leading-relaxed text-muted">{intro}</p> : null}
        <span className="rule-gold mt-7" />
      </header>

      <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit lg:sticky lg:top-28">
          <NavGroup title="Service client" links={SERVICE_LINKS} pathname={pathname} />
          <NavGroup
            title="Informations légales"
            links={LEGAL_LINKS}
            pathname={pathname}
            className="mt-8"
          />
        </aside>

        <div className={bare ? '' : 'legal-prose max-w-3xl'}>{children}</div>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  links,
  pathname,
  className = '',
}: {
  title: string;
  links: { href: string; label: string }[];
  pathname: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-3 text-xs uppercase tracking-luxe text-gold">{title}</p>
      <ul className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                  active
                    ? 'bg-gold/10 font-medium text-gold'
                    : 'text-muted hover:bg-sand/60 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
