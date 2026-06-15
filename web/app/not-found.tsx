import { Button } from '@/components/Button';

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="eyebrow">Erreur 404</span>
      <h1 className="mt-3 text-5xl">Page introuvable</h1>
      <p className="mt-4 max-w-md text-sm text-muted">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="mt-8">
        <Button href="/" variant="secondary">
          Retour à l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
