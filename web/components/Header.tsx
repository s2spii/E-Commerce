'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Collapse / solidify the bar once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Briefly "bump" the cart badge whenever the count changes.
  useEffect(() => {
    if (prevCount.current !== count) {
      prevCount.current = count;
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      return () => clearTimeout(t);
    }
  }, [count]);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-500 ease-spring ${
        scrolled
          ? 'border-line/80 bg-ivory/85 shadow-soft backdrop-blur-xl'
          : 'border-transparent bg-ivory/40 backdrop-blur-md'
      }`}
    >
      <div
        className={`container-luxe flex items-center justify-between transition-all duration-500 ease-spring ${
          scrolled ? 'h-16' : 'h-20'
        }`}
      >
        {/* Mobile menu toggle — morphs into an X */}
        <button
          type="button"
          className="-ml-1 flex h-9 w-9 flex-col items-center justify-center gap-1.5 text-ink md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`block h-px w-6 bg-ink transition-all duration-300 ease-spring ${
              open ? 'translate-y-[7px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-6 bg-ink transition-all duration-300 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`block h-px w-6 bg-ink transition-all duration-300 ease-spring ${
              open ? '-translate-y-[7px] -rotate-45' : ''
            }`}
          />
        </button>

        {/* Left nav (desktop) */}
        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={isActive(link.href)}
              className={`nav-link ${isActive(link.href) ? 'text-gold' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Brand */}
        <Link
          href="/"
          className="group absolute left-1/2 -translate-x-1/2 font-serif text-xl tracking-[0.3em] text-ink transition-colors hover:text-gold"
        >
          MAISON<span className="text-gold transition-colors group-hover:text-ink"> LUMA</span>
        </Link>

        {/* Right utilities */}
        <div className="flex items-center gap-5 sm:gap-6">
          <Link
            href={profile ? '/compte' : '/connexion'}
            className="nav-link hidden items-center gap-2 sm:inline-flex"
            aria-label="Compte"
          >
            <UserIcon />
            <span className="hidden lg:inline">{profile ? 'Compte' : 'Connexion'}</span>
          </Link>
          <Link
            href="/panier"
            className="group relative inline-flex items-center gap-2 text-ink transition-colors hover:text-gold"
            aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}
          >
            <span className="relative">
              <BagIcon />
              <span
                className={`absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-gradient px-1 text-[9px] font-medium tabular-nums text-noir shadow-sm transition-transform duration-300 ${
                  bump ? 'scale-125' : 'scale-100'
                } ${count === 0 ? 'opacity-0' : 'opacity-100'}`}
              >
                {count}
              </span>
            </span>
            <span className="hidden text-sm tracking-wide lg:inline">Panier</span>
          </Link>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <div
        className={`overflow-hidden border-line bg-ivory/95 backdrop-blur-xl transition-all duration-500 ease-spring md:hidden ${
          open ? 'max-h-80 border-t opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="container-luxe flex flex-col gap-1 py-5">
          {[...NAV_LINKS, { href: profile ? '/compte' : '/connexion', label: profile ? 'Compte' : 'Connexion' }].map(
            (link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${80 + i * 60}ms` : '0ms' }}
                className={`border-b border-line/60 py-3 font-serif text-2xl text-ink transition-all duration-500 ease-spring hover:text-gold ${
                  open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
    </svg>
  );
}
