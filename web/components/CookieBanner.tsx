'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'luma-cookie-consent';

/**
 * Minimal RGPD-friendly cookie consent banner. Persists the choice in
 * localStorage so it only appears once. Slides up on first visit.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Small delay so it animates in after the page settles.
        const t = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      /* localStorage unavailable — stay hidden */
    }
  }, []);

  const decide = (choice: 'accepted' | 'refused') => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[55] transition-all duration-700 ease-spring ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
      role="dialog"
      aria-label="Préférences de cookies"
      aria-hidden={!visible}
    >
      <div className="container-luxe pb-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-ivory/95 p-5 shadow-lift backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="text-sm text-muted">
            Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. En
            poursuivant, vous acceptez notre{' '}
            <Link href="/cookies" className="text-gold underline-offset-4 hover:underline">
              politique de cookies
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => decide('refused')}
              className="rounded-full border border-line px-5 py-2.5 text-xs uppercase tracking-widest text-ink transition-all hover:-translate-y-0.5 hover:border-ink"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              className="group relative overflow-hidden rounded-full bg-ink px-6 py-2.5 text-xs uppercase tracking-widest text-ivory transition-all hover:-translate-y-0.5 hover:text-ink"
            >
              <span className="relative z-10">Accepter</span>
              <span className="absolute inset-0 translate-y-full bg-gold-gradient transition-transform duration-500 ease-spring group-hover:translate-y-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
