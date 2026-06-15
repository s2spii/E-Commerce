'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

/** Static newsletter sign-up (no backend endpoint — confirms locally). */
export function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="bg-ink py-20 text-ivory">
      <div className="container-luxe flex flex-col items-center text-center">
        <span className="text-xs uppercase tracking-widest text-gold">Le Cercle Luma</span>
        <h2 className="mt-3 text-4xl text-ivory">Restez informé·e</h2>
        <p className="mt-3 max-w-md text-sm text-ivory/70">
          Recevez en avant-première nos nouvelles pièces et nos rendez-vous confidentiels.
        </p>

        {done ? (
          <p className="mt-8 text-sm text-gold">Merci — votre inscription a bien été prise en compte.</p>
        ) : (
          <form
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
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
              className="flex-1 border border-ivory/30 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none"
            />
            <Button type="submit" variant="primary" className="bg-gold text-ink hover:bg-ivory">
              S&apos;inscrire
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
