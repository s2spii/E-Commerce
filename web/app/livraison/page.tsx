import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Livraison & suivi' };

export default function LivraisonPage() {
  return (
    <LegalLayout
      title="Livraison & suivi"
      updatedAt="15 juin 2026"
      intro="Chaque commande est préparée avec soin et expédiée dans un emballage signature Maison Luma."
    >
      <h2>Zones de livraison</h2>
      <p>
        Nous livrons en France métropolitaine, dans l&apos;Union européenne et à l&apos;international.
        Les destinations disponibles sont proposées lors de la validation de la commande.
      </p>

      <h2>Frais de livraison</h2>
      <ul>
        <li>
          <strong>Livraison offerte</strong> en France métropolitaine dès <strong>200 €</strong>{' '}
          d&apos;achat.
        </li>
        <li>En deçà, les frais sont calculés automatiquement selon la destination au moment du paiement.</li>
        <li>Les tarifs pour l&apos;Union européenne et l&apos;international sont affichés avant le règlement.</li>
      </ul>

      <h2>Délais de préparation et d&apos;expédition</h2>
      <p>
        Les commandes sont préparées sous 1 à 2 jours ouvrés. Les délais de livraison indicatifs sont
        les suivants :
      </p>
      <ul>
        <li>France métropolitaine : 2 à 4 jours ouvrés.</li>
        <li>Union européenne : 3 à 7 jours ouvrés.</li>
        <li>International : 5 à 12 jours ouvrés.</li>
      </ul>

      <h2>Suivi de commande</h2>
      <p>
        Dès l&apos;expédition de votre commande, un e-mail de confirmation vous est adressé. Vous
        pouvez à tout moment consulter le statut de vos commandes depuis votre{' '}
        <Link href="/compte/commandes">espace commandes</Link>.
      </p>

      <h2>Réception</h2>
      <p>
        Nous vous invitons à vérifier l&apos;état de votre colis à la réception. En cas
        d&apos;anomalie, contactez-nous via la page <Link href="/contact">Contact</Link> afin que
        nous trouvions rapidement une solution.
      </p>
    </LegalLayout>
  );
}
