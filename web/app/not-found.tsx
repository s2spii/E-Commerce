import { Button } from '@/components/Button';

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-gradient-gold animate-fade-up select-none font-serif text-[7rem] leading-none sm:text-[10rem]">
        404
      </p>
      <span className="eyebrow eyebrow-center animate-fade-up before:hidden" style={{ animationDelay: '0.1s' }}>
        Page introuvable
      </span>
      <h1 className="animate-fade-up mt-4 text-4xl sm:text-5xl" style={{ animationDelay: '0.2s' }}>
        Cette adresse s&apos;est égarée
      </h1>
      <p className="animate-fade-up mt-4 max-w-md text-sm text-muted" style={{ animationDelay: '0.3s' }}>
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="animate-fade-up mt-9" style={{ animationDelay: '0.4s' }}>
        <Button href="/" variant="secondary">
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
