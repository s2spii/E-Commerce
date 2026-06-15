'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/api';
import { Button } from '@/components/Button';
import { PageSpinner } from '@/components/Spinner';

export default function AccountPage() {
  const { profile, loading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  if (loading || !profile) return <PageSpinner />;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 border-b border-line pb-8">
        <span className="eyebrow">Espace client</span>
        <h1 className="mt-3 text-5xl">Bonjour{fullName ? `, ${fullName}` : ''}</h1>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* Profile card */}
        <section className="space-y-6 border border-line bg-surface p-8">
          <h2 className="text-2xl">Mes informations</h2>
          <dl className="space-y-4 text-sm">
            <Detail label="Nom" value={fullName || '—'} />
            <Detail label="E-mail" value={profile.email} />
            <Detail label="Téléphone" value={profile.phone || '—'} />
            <Detail label="Authentification 2FA" value={profile.mfaEnabled ? 'Activée' : 'Désactivée'} />
            <Detail label="Membre depuis" value={formatDate(profile.createdAt)} />
          </dl>
        </section>

        {/* Actions */}
        <aside className="space-y-4">
          <div className="border border-line bg-surface p-8">
            <h3 className="mb-4 text-xl">Mes commandes</h3>
            <p className="mb-5 text-sm text-muted">Consultez l&apos;historique et le suivi de vos commandes.</p>
            <Button href="/compte/commandes" variant="secondary" fullWidth>
              Voir mes commandes
            </Button>
          </div>
          <Button onClick={handleLogout} variant="ghost" fullWidth>
            Se déconnecter
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line pb-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
