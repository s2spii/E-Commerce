'use client';

import { useState } from 'react';
import { Reveal } from '@/components/Reveal';

/** Static newsletter sign-up (no backend endpoint — confirms locally). */
export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="container-luxe py-20">
      <Reveal direction="scale">
        <div className="grain relative overflow-hidden rounded-4xl bg-noir px-6 py-16 text-center text-ivory shadow-lift sm:py-20">
          {/* Floating ambient orbs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-0 h-56 w-56 animate-float rounded-full bg-gold/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 animate-float rounded-full bg-champagne/15 blur-3xl"
            style={{ animationDelay: '1.5s' }}
          />

          <div className="relative mx-auto flex max-w-xl flex-col items-center">
            <span className="eyebrow eyebrow-center before:hidden">Le Cercle Luma</span>
            <h2 className="mt-4 text-4xl sm:text-5xl">
              Entrez dans le <span className="text-gradient-gold">cercle</span>
            </h2>
            <p className="mt-4 max-w-md text-sm text-ivory/65">
              Recevez en avant-première nos nouvelles pièces et nos rendez-vous confidentiels.
            </p>

            {done ? (
              <p className="mt-9 rounded-full border border-gold/40 bg-gold/10 px-6 py-3 text-sm text-champagne">
                Merci — votre inscription a bien été prise en compte.
              </p>
            ) : (
              <form
                className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setDone(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  className="flex-1 rounded-full border border-ivory/20 bg-ivory/5 px-5 py-3.5 text-sm text-ivory placeholder:text-ivory/40 transition-colors focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gold-gradient px-7 py-3.5 text-xs uppercase tracking-widest text-noir transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <span className="relative z-10">S&apos;inscrire</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-luxe group-hover:translate-x-full" />
                </button>
              </form>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
