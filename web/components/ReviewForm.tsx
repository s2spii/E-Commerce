'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/Button';

/** Authenticated review submission for a product (held for moderation). */
export function ReviewForm({ slug }: { slug: string }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
        <Link
          href={`/connexion?redirect=/produit/${slug}`}
          className="text-gold underline-offset-4 hover:underline"
        >
          Connectez-vous
        </Link>{' '}
        pour partager votre avis sur cette pièce.
      </div>
    );
  }

  if (done) {
    return (
      <div className="animate-fade-up rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center text-sm text-gold">
        Merci pour votre avis&nbsp;! Il sera publié après modération.
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast('Sélectionnez une note', 'info');
      return;
    }
    setBusy(true);
    try {
      await api(`/catalog/products/${slug}/reviews`, {
        method: 'POST',
        body: { rating, title: title.trim() || undefined, body: body.trim() || undefined },
      });
      setDone(true);
      toast('Avis envoyé, merci !', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Envoi impossible pour le moment.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <h3 className="font-serif text-xl">Laisser un avis</h3>

      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            aria-checked={rating === n}
            role="radio"
            className={`text-2xl transition-colors ${
              (hover || rating) >= n ? 'text-gold' : 'text-muted/30'
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre (optionnel)"
        maxLength={160}
        className="input-luxe mt-4"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Partagez votre expérience (optionnel)"
        rows={4}
        maxLength={4000}
        className="input-luxe mt-3 resize-y"
      />

      <Button type="submit" disabled={busy} className="mt-4">
        {busy ? 'Envoi…' : 'Publier mon avis'}
      </Button>
    </form>
  );
}
