import Image from 'next/image';
import { Button } from '@/components/Button';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { Newsletter } from '@/components/Newsletter';
import { Reveal } from '@/components/Reveal';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80';
const STORY_IMAGE =
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1400&q=80';

const PROMISES = [
  { title: 'Livraison soignée', text: 'Offerte dès 200 € · emballage signature' },
  { title: 'Paiement sécurisé', text: 'Transactions chiffrées de bout en bout' },
  { title: 'Service dédié', text: 'Un conseil personnalisé par nos artisans' },
];

const TESTIMONIALS = [
  {
    quote:
      'Une qualité de fabrication rare. Chaque pièce reçue dépasse mes attentes — l’emballage est une expérience en soi.',
    author: 'Camille R.',
    role: 'Cliente depuis 2023',
  },
  {
    quote:
      'Le souci du détail est partout, du site jusqu’au service client. On sent une véritable maison derrière.',
    author: 'Antoine M.',
    role: 'Paris',
  },
  {
    quote:
      'Des matières nobles et un style intemporel. Je n’achète plus que des pièces qui durent, et Maison Luma l’a compris.',
    author: 'Inès B.',
    role: 'Cliente fidèle',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 animate-kenburns">
          <Image
            src={HERO_IMAGE}
            alt="Maison Luma"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-noir-veil" />
        <div className="absolute inset-0 bg-noir/25" />

        <div className="container-luxe relative z-10 text-center text-ivory">
          <span
            className="animate-fade-up inline-block text-xs uppercase tracking-luxe text-ivory/80"
            style={{ animationDelay: '0.1s' }}
          >
            Maison Luma — depuis Paris
          </span>
          <h1
            className="display-1 animate-fade-up mx-auto mt-6 max-w-4xl font-serif text-ivory"
            style={{ animationDelay: '0.25s' }}
          >
            L&apos;art de l&apos;essentiel,{' '}
            <span className="text-gradient-gold italic">sublimé</span>
          </h1>
          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-ivory/85"
            style={{ animationDelay: '0.4s' }}
          >
            Une collection rare de pièces intemporelles, façonnées avec exigence par des maisons
            d&apos;exception.
          </p>
          <div
            className="animate-fade-up mt-10 flex flex-wrap justify-center gap-4"
            style={{ animationDelay: '0.55s' }}
          >
            <Button href="/boutique" size="lg" className="!bg-ivory !text-noir hover:!text-noir">
              Explorer la collection
            </Button>
            <Button
              href="/notre-maison"
              size="lg"
              variant="secondary"
              className="!border-ivory/50 !text-ivory hover:!text-noir"
            >
              Notre histoire
            </Button>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          aria-hidden
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
        >
          <span className="text-[10px] uppercase tracking-luxe text-ivory/60">Défiler</span>
          <span className="relative flex h-9 w-5 justify-center rounded-full border border-ivory/40">
            <span className="mt-1.5 h-1.5 w-1 animate-scroll-hint rounded-full bg-ivory/80" />
          </span>
        </div>
      </section>

      {/* Service promises */}
      <section className="border-b border-line bg-surface/60">
        <div className="container-luxe grid gap-8 py-10 sm:grid-cols-3">
          {PROMISES.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 100}
              className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-4 sm:text-left"
            >
              <span aria-hidden className="text-2xl text-gold">
                ✦
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">{p.title}</span>
                <span className="block text-xs text-muted">{p.text}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured selection (client-fetched) */}
      <FeaturedSection />

      {/* Categories (client-fetched) */}
      <CategoryStrip />

      {/* Brand story teaser */}
      <section className="container-luxe grid items-center gap-12 py-28 md:grid-cols-2">
        <Reveal direction="left" className="relative">
          {/* Offset gold frame */}
          <span
            aria-hidden
            className="absolute -bottom-5 -left-5 -z-10 h-full w-full rounded-3xl border border-gold/40"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand shadow-lift">
            <Image
              src={STORY_IMAGE}
              alt="L'atelier Maison Luma"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-[1200ms] ease-spring hover:scale-105"
            />
          </div>
        </Reveal>

        <Reveal direction="right">
          <span className="eyebrow">Notre Maison</span>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
            Un savoir-faire, une obsession du détail
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Chaque pièce naît d&apos;une rencontre entre des matières nobles et des artisans
            d&apos;exception. Nous privilégions la rareté à l&apos;abondance, et le geste juste à
            l&apos;effet de mode. C&apos;est cette discipline qui définit l&apos;esprit Maison Luma.
          </p>
          <div className="mt-9">
            <Button href="/notre-maison" variant="secondary">
              Découvrir notre histoire
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Testimonials */}
      <section className="bg-sand/60 py-24">
        <div className="container-luxe">
          <Reveal className="mb-12 text-center">
            <span className="eyebrow eyebrow-center before:hidden">Ils nous font confiance</span>
            <h2 className="mt-4 text-4xl sm:text-5xl">Paroles de clients</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.author} delay={i * 120}>
                <figure className="card-luxe flex h-full flex-col p-8">
                  <span aria-hidden className="font-serif text-5xl leading-none text-gold">
                    “
                  </span>
                  <span className="mt-1 text-sm text-gold">★★★★★</span>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-line pt-4">
                    <span className="block font-serif text-lg text-ink">{t.author}</span>
                    <span className="block text-xs uppercase tracking-widest text-muted">
                      {t.role}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
