import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Maison',
    links: [
      { href: '/notre-maison', label: 'Notre Maison' },
      { href: '/boutique', label: 'La Boutique' },
    ],
  },
  {
    title: 'Service',
    links: [
      { href: '/compte', label: 'Mon compte' },
      { href: '/compte/commandes', label: 'Mes commandes' },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-luxe grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl tracking-[0.3em] text-ink">MAISON LUMA</p>
          <p className="mt-4 max-w-sm text-sm text-muted">
            L&apos;artisanat d&apos;exception, pensé pour durer. Une sélection rare de pièces
            intemporelles, façonnées par des maisons d&apos;exception.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="eyebrow mb-4">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container-luxe flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted sm:flex-row">
          <p>© {year} Maison Luma. Tous droits réservés.</p>
          <p>Prix TTC en euros · Livraison soignée</p>
        </div>
      </div>
    </footer>
  );
}
