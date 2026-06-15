import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://maisonluma.example';

/** Public, crawlable routes (private/transactional pages are excluded). */
const ROUTES = [
  '',
  '/boutique',
  '/notre-maison',
  '/favoris',
  '/contact',
  '/faq',
  '/livraison',
  '/retours',
  '/mentions-legales',
  '/cgv',
  '/confidentialite',
  '/cookies',
  '/connexion',
  '/inscription',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
