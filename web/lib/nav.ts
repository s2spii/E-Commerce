/** Shared service & legal navigation, used by the footer and LegalLayout. */

export interface NavLink {
  href: string;
  label: string;
}

export const SERVICE_LINKS: NavLink[] = [
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
  { href: '/livraison', label: 'Livraison & suivi' },
  { href: '/retours', label: 'Retours & remboursements' },
];

export const LEGAL_LINKS: NavLink[] = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgv', label: 'Conditions générales de vente' },
  { href: '/confidentialite', label: 'Politique de confidentialité' },
  { href: '/cookies', label: 'Politique de cookies' },
];

export const MAISON_LINKS: NavLink[] = [
  { href: '/notre-maison', label: 'Notre Maison' },
  { href: '/boutique', label: 'La Boutique' },
  { href: '/compte', label: 'Mon compte' },
];
