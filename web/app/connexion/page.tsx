'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';

function LoginForm() {
  const { login } = useAuth();
  const { refresh: refreshCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/compte';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await login(email, password, mfaRequired ? mfaToken : undefined);
      if ('mfaRequired' in result) {
        setMfaRequired(true);
        setError('Saisissez votre code d’authentification à deux facteurs.');
        return;
      }
      // Re-price the cart now that we're authenticated, then continue.
      await refreshCart();
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-luxe flex justify-center py-20">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-line bg-surface/80 p-8 shadow-soft backdrop-blur sm:p-10">
        <div className="mb-8 text-center">
          <span className="eyebrow eyebrow-center before:hidden">Espace client</span>
          <h1 className="mt-3 text-4xl">Connexion</h1>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Adresse e-mail" htmlFor="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-luxe"
            />
          </Field>

          <Field label="Mot de passe" htmlFor="password">
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-luxe"
            />
          </Field>

          {mfaRequired ? (
            <Field label="Code d’authentification (2FA)" htmlFor="mfa">
              <input
                id="mfa"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                className="input-luxe tracking-[0.4em]"
                placeholder="000000"
              />
            </Field>
          ) : null}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <Button type="submit" fullWidth size="lg" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="text-gold underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="eyebrow mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
