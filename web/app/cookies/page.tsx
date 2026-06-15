import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Politique de cookies' };

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Politique de cookies"
      updatedAt="15 juin 2026"
      intro="Cette page explique ce que sont les cookies, lesquels nous utilisons et comment vous pouvez gérer vos préférences."
    >
      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d&apos;un
        site. Il permet de reconnaître votre navigateur, de mémoriser vos préférences et de mesurer
        l&apos;audience.
      </p>

      <h2>Cookies que nous utilisons</h2>
      <ul>
        <li>
          <strong>Cookies strictement nécessaires</strong> : indispensables au fonctionnement du
          site (panier, session, sécurité). Ils ne requièrent pas de consentement.
        </li>
        <li>
          <strong>Cookies de mesure d&apos;audience</strong> : nous aident à comprendre
          l&apos;utilisation du site afin de l&apos;améliorer.
        </li>
        <li>
          <strong>Cookies de personnalisation</strong> : mémorisent vos préférences pour une
          expérience adaptée.
        </li>
      </ul>

      <h2>Votre consentement</h2>
      <p>
        Lors de votre première visite, un bandeau vous permet d&apos;accepter ou de refuser les
        cookies non essentiels. Vous pouvez modifier votre choix à tout moment en supprimant les
        cookies de votre navigateur, ce qui réaffichera le bandeau de préférences.
      </p>

      <h2>Gérer les cookies depuis votre navigateur</h2>
      <p>
        Vous pouvez configurer votre navigateur pour accepter, refuser ou supprimer les cookies. La
        marche à suivre est disponible dans le menu d&apos;aide de chaque navigateur (Chrome,
        Firefox, Safari, Edge). Le refus de certains cookies peut limiter votre expérience sur le
        site.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les cookies sont conservés pour une durée maximale de treize (13) mois à compter de leur
        dépôt. Au-delà, votre consentement vous sera de nouveau demandé.
      </p>
    </LegalLayout>
  );
}
