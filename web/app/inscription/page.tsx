'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/Button';

const PASSWORD_HINT = 'Au moins 12 caractères, avec majuscule, minuscule et chiffre.';

/** Client-side mirror of the server password policy for early feedback. */
function isPasswordValid(pw: string): boolean {
  return pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { refresh: refreshCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(form.password)) {
      setError(PASSWORD_HINT);
      return;
    }

    setBusy(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      });
      await refreshCart();
      router.push('/compte');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-luxe flex justify-center py-20">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-line bg-surface/80 p-8 shadow-soft backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <span className="eyebrow eyebrow-center before:hidden">Rejoignez la maison</span>
          <h1 className="mt-3 text-4xl">Créer un compte</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="eyebrow mb-2 block">
                Prénom
              </label>
              <input id="firstName" type="text" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} className="input-luxe" />
            </div>
            <div>
              <label htmlFor="lastName" className="eyebrow mb-2 block">
                Nom
              </label>
              <input id="lastName" type="text" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} className="input-luxe" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="eyebrow mb-2 block">
              Adresse e-mail
            </label>
            <input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} className="input-luxe" />
          </div>

          <div>
            <label htmlFor="password" className="eyebrow mb-2 block">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              className="input-luxe"
            />
            <p className="mt-2 text-xs text-muted">{PASSWORD_HINT}</p>
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <Button type="submit" fullWidth size="lg" disabled={busy}>
            {busy ? 'Création…' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Vous avez déjà un compte ?{' '}
          <Link href="/connexion" className="text-gold underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
