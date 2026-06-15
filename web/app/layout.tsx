import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { ScrollProgress } from '@/components/ScrollProgress';
import { CartDrawer } from '@/components/CartDrawer';
import { CookieBanner } from '@/components/CookieBanner';
import { BackToTop } from '@/components/BackToTop';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { CartUIProvider } from '@/context/CartUIContext';
import { ToastProvider } from '@/context/ToastContext';
import { WishlistProvider } from '@/context/WishlistContext';

// Serif display for headings, Inter for body/UI. Exposed as CSS variables and
// wired into the Tailwind theme (see tailwind.config.ts).
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://maisonluma.example';
const SITE_DESCRIPTION =
  'Maison Luma — une sélection rare de pièces intemporelles, façonnées par des maisons d’exception. Prix TTC en euros.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Maison Luma — L’artisanat d’exception',
    template: '%s · Maison Luma',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'Maison Luma',
  keywords: ['Maison Luma', 'luxe', 'artisanat', 'mode', 'pièces intemporelles', 'Paris'],
  authors: [{ name: 'Maison Luma' }],
  creator: 'Maison Luma',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Maison Luma',
    title: 'Maison Luma — L’artisanat d’exception',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maison Luma — L’artisanat d’exception',
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0E0C0A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <CartProvider>
            <CartUIProvider>
              <ToastProvider>
                <WishlistProvider>
                  <a href="#contenu" className="skip-link">
                    Aller au contenu
                  </a>
                  <ScrollProgress />
                  <AnnouncementBar />
                  <Header />
                  <main id="contenu" className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <CartDrawer />
                  <CookieBanner />
                  <BackToTop />
                </WishlistProvider>
              </ToastProvider>
            </CartUIProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
