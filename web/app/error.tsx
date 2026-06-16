'use client';

import { useEffect } from 'react';
import { Button } from '@/components/Button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-luxe flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span className="text-gradient-gold animate-fade-up select-none font-serif text-[5rem] leading-none sm:text-[7rem]">
        Oups
      </span>
      <span
        className="eyebrow eyebrow-center animate-fade-up before:hidden"
        style={{ animationDelay: '0.1s' }}
      >
        Une erreur est survenue
      </span>
      <h1 className="animate-fade-up mt-4 text-3xl sm:text-4xl" style={{ animationDelay: '0.2s' }}>
        Quelque chose s&apos;est mal passé
      </h1>
      <p className="animate-fade-up mt-4 max-w-md text-sm text-muted" style={{ animationDelay: '0.3s' }}>
        Nous sommes désolés pour la gêne occasionnée. Vous pouvez réessayer ou revenir à
        l&apos;accueil.
      </p>
      <div
        className="animate-fade-up mt-9 flex flex-wrap justify-center gap-4"
        style={{ animationDelay: '0.4s' }}
      >
        <Button onClick={reset}>Réessayer</Button>
        <Button href="/" variant="secondary">
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
