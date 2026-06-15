'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/boutique', label: 'Boutique' },
  { href: '/notre-maison', label: 'Notre Maison' },
];

export function Header() {
  const { count } = useCart();
  const { profile } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="container-luxe flex h-20 items-center justify-between">
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="-ml-1 p-1 text-ink md:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-px w-6 bg-ink" />
          <span className="mt-1.5 block h-px w-6 bg-ink" />
          <span className="mt-1.5 block h-px w-6 bg-ink" />
        </button>

        {/* Left nav (desktop) */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? 'text-gold' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Brand */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-serif text-xl tracking-[0.3em] text-ink"
        >
          MAISON LUMA
        </Link>

        {/* Right utilities */}
        <div className="flex items-center gap-6">
          <Link
            href={profile ? '/compte' : '/connexion'}
            className="nav-link hidden sm:inline"
            aria-label="Compte"
          >
            {profile ? 'Compte' : 'Connexion'}
          </Link>
          <Link href="/panier" className="nav-link relative inline-flex items-center" aria-label="Panier">
            Panier
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-ink px-1 text-[10px] tabular-nums">
              {count}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open ? (
        <nav className="border-t border-line bg-ivory md:hidden">
          <div className="container-luxe flex flex-col gap-4 py-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href={profile ? '/compte' : '/connexion'} className="nav-link" onClick={() => setOpen(false)}>
              {profile ? 'Compte' : 'Connexion'}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
