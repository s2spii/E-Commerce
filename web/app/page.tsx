import Image from 'next/image';
import { Button } from '@/components/Button';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { Newsletter } from '@/components/Newsletter';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80';
const STORY_IMAGE =
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1400&q=80';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Maison Luma"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="container-luxe relative z-10 text-center text-ivory">
          <span className="text-xs uppercase tracking-widest text-ivory/80">
            Maison Luma — depuis Paris
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-5xl leading-tight text-ivory md:text-6xl">
            L&apos;art de l&apos;essentiel, sublimé
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ivory/85">
            Une collection rare de pièces intemporelles, façonnées avec exigence par des maisons
            d&apos;exception.
          </p>
          <div className="mt-9 flex justify-center">
            <Button href="/boutique" size="lg" className="bg-ivory text-ink hover:bg-gold">
              Explorer la collection
            </Button>
          </div>
        </div>
      </section>

      {/* Featured selection (client-fetched) */}
      <FeaturedSection />

      {/* Categories (client-fetched) */}
      <CategoryStrip />

      {/* Brand story teaser */}
      <section className="container-luxe grid items-center gap-12 py-24 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden bg-line/40">
          <Image
            src={STORY_IMAGE}
            alt="L'atelier Maison Luma"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <span className="eyebrow">Notre Maison</span>
          <h2 className="mt-3 text-4xl leading-tight">Un savoir-faire, une obsession du détail</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Chaque pièce naît d&apos;une rencontre entre des matières nobles et des artisans
            d&apos;exception. Nous privilégions la rareté à l&apos;abondance, et le geste juste à
            l&apos;effet de mode. C&apos;est cette discipline qui définit l&apos;esprit Maison Luma.
          </p>
          <div className="mt-8">
            <Button href="/notre-maison" variant="secondary">
              Découvrir notre histoire
            </Button>
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
