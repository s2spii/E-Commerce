import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Retours & remboursements' };

export default function RetoursPage() {
  return (
    <LegalLayout
      title="Retours & remboursements"
      updatedAt="15 juin 2026"
      intro="Votre satisfaction est essentielle. Si une pièce ne vous convient pas, vous disposez de quatorze jours pour la retourner."
    >
      <h2>Délai de rétractation</h2>
      <p>
        Vous disposez d&apos;un délai de <strong>14 jours</strong> à compter de la réception de votre
        commande pour exercer votre droit de rétractation, sans avoir à justifier de motif ni à payer
        de pénalité.
      </p>

      <h2>Conditions de retour</h2>
      <ul>
        <li>Les articles doivent être retournés neufs, non portés et non lavés.</li>
        <li>Les étiquettes et l&apos;emballage d&apos;origine doivent être conservés.</li>
        <li>Tout article endommagé ou incomplet pourra faire l&apos;objet d&apos;un refus.</li>
      </ul>

      <h2>Procédure</h2>
      <ol>
        <li>
          Contactez-nous via la page <Link href="/contact">Contact</Link> en indiquant votre numéro
          de commande.
        </li>
        <li>Nous vous communiquons l&apos;adresse de retour et les instructions.</li>
        <li>Renvoyez le colis soigneusement emballé dans le délai imparti.</li>
        <li>Dès réception et vérification, nous procédons au remboursement.</li>
      </ol>

      <h2>Remboursement</h2>
      <p>
        Le remboursement est effectué via le moyen de paiement utilisé lors de la commande, dans un
        délai maximum de <strong>14 jours</strong> suivant la réception du retour. Les frais de
        retour restent à la charge du client, sauf en cas d&apos;erreur de notre part ou de produit
        défectueux.
      </p>

      <h2>Article défectueux</h2>
      <p>
        Si vous recevez un article défectueux ou non conforme, contactez-nous sans délai : nous
        organisons à nos frais l&apos;échange ou le remboursement intégral, frais de livraison
        compris.
      </p>
    </LegalLayout>
  );
}
