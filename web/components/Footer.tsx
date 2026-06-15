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

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Pinterest', href: 'https://pinterest.com' },
  { label: 'Journal', href: '/notre-maison' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="grain relative mt-24 overflow-hidden bg-noir text-ivory">
      {/* Ambient gold glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
      />

      <div className="container-luxe relative grid gap-12 py-20 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-serif text-3xl tracking-[0.3em]">
            MAISON<span className="text-gradient-gold"> LUMA</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/60">
            L&apos;artisanat d&apos;exception, pensé pour durer. Une sélection rare de pièces
            intemporelles, façonnées par des maisons d&apos;exception.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {SOCIALS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="rounded-full border border-ivory/15 px-4 py-2 text-[11px] uppercase tracking-widest text-ivory/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs uppercase tracking-luxe text-gold">{col.title}</h4>
            <ul className="mt-5 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-ivory/65 transition-colors hover:text-ivory"
                  >
                    <span className="h-px w-0 bg-gold transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-ivory/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-2 py-6 text-xs text-ivory/45 sm:flex-row">
          <p>© {year} Maison Luma. Tous droits réservés.</p>
          <p>Prix TTC en euros · Livraison soignée</p>
        </div>
      </div>
    </footer>
  );
}
