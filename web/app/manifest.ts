import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Maison Luma — L’artisanat d’exception',
    short_name: 'Maison Luma',
    description:
      'Une sélection rare de pièces intemporelles, façonnées par des maisons d’exception.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F1',
    theme_color: '#0E0C0A',
    lang: 'fr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
