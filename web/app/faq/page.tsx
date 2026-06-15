import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { Accordion, type AccordionItem } from '@/components/Accordion';

export const metadata: Metadata = { title: 'Foire aux questions' };

const FAQ: AccordionItem[] = [
  {
    q: 'Comment passer une commande ?',
    a: "Ajoutez les pièces souhaitées à votre panier, puis cliquez sur « Passer la commande ». Renseignez votre adresse de livraison et procédez au paiement sécurisé. Un e-mail de confirmation vous est ensuite envoyé.",
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: "Les moyens de paiement disponibles sont présentés lors de l'étape de règlement. Toutes les transactions sont chiffrées et sécurisées.",
  },
  {
    q: 'Quels sont les délais de livraison ?',
    a: "Les commandes sont préparées sous 1 à 2 jours ouvrés. Comptez 2 à 4 jours pour la France, 3 à 7 jours pour l'Union européenne. Plus de détails sur la page Livraison & suivi.",
  },
  {
    q: 'La livraison est-elle offerte ?',
    a: "Oui, la livraison est offerte en France métropolitaine dès 200 € d'achat. En deçà, les frais sont calculés automatiquement selon la destination.",
  },
  {
    q: 'Comment retourner un article ?',
    a: "Vous disposez de 14 jours après réception pour retourner un article neuf et non porté. Contactez-nous via la page Contact pour recevoir les instructions de retour.",
  },
  {
    q: 'Comment suivre ma commande ?',
    a: "Vous pouvez consulter le statut de vos commandes à tout moment depuis votre espace commandes, accessible une fois connecté à votre compte.",
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: "Absolument. Nous appliquons des mesures de sécurité strictes et respectons le RGPD. Consultez notre politique de confidentialité pour en savoir plus.",
  },
];

export default function FaqPage() {
  return (
    <LegalLayout
      title="Foire aux questions"
      intro="Retrouvez les réponses aux questions les plus fréquentes. Vous ne trouvez pas votre réponse ? Notre équipe est à votre écoute."
    >
      <Accordion items={FAQ} />
    </LegalLayout>
  );
}
