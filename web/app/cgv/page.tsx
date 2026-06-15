import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Conditions générales de vente' };

export default function CgvPage() {
  return (
    <LegalLayout
      title="Conditions générales de vente"
      updatedAt="15 juin 2026"
      intro="Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Maison Luma et tout client effectuant un achat sur le site. Toute commande implique l'acceptation pleine et entière des présentes CGV."
    >
      <h2>Article 1 — Objet</h2>
      <p>
        Les présentes CGV déterminent les droits et obligations des parties dans le cadre de la
        vente en ligne des produits proposés par Maison Luma. Elles s&apos;appliquent à
        l&apos;exclusion de toute autre condition.
      </p>

      <h2>Article 2 — Produits</h2>
      <p>
        Les produits proposés sont décrits et présentés avec la plus grande exactitude possible. Les
        photographies sont les plus fidèles possibles mais ne sauraient engager la responsabilité de
        Maison Luma en cas de différence mineure. Les produits sont proposés dans la limite des
        stocks disponibles.
      </p>

      <h2>Article 3 — Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises (TTC), hors frais de livraison. Maison
        Luma se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés sur
        la base des tarifs en vigueur au moment de la validation de la commande.
      </p>

      <h2>Article 4 — Commande</h2>
      <p>
        Le client valide sa commande après avoir vérifié le contenu de son panier. La vente est
        réputée conclue à la confirmation de la commande. Maison Luma se réserve le droit
        d&apos;annuler toute commande présentant un litige de paiement ou un caractère anormal.
      </p>

      <h2>Article 5 — Paiement</h2>
      <p>
        Le règlement s&apos;effectue en ligne par les moyens de paiement proposés au moment de la
        commande. Les paiements sont sécurisés. La commande n&apos;est traitée qu&apos;après
        confirmation de l&apos;accord du centre de paiement.
      </p>

      <h2>Article 6 — Livraison</h2>
      <p>
        Les modalités, délais et frais de livraison sont précisés sur la page{' '}
        <Link href="/livraison">Livraison &amp; suivi</Link>. Les délais sont donnés à titre
        indicatif. En
        cas de retard, le client en est informé dans les meilleurs délais.
      </p>

      <h2>Article 7 — Droit de rétractation</h2>
      <p>
        Conformément aux articles L.221-18 et suivants du Code de la consommation, le client dispose
        d&apos;un délai de <strong>quatorze (14) jours</strong> à compter de la réception des
        produits pour exercer son droit de rétractation, sans avoir à justifier de motif. Les
        modalités sont détaillées sur la page{' '}
        <Link href="/retours">Retours &amp; remboursements</Link>.
      </p>

      <h2>Article 8 — Garanties</h2>
      <p>
        Tous les produits bénéficient de la garantie légale de conformité (articles L.217-3 et
        suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641
        et suivants du Code civil), permettant le remplacement ou le remboursement des produits
        défectueux.
      </p>

      <h2>Article 9 — Responsabilité</h2>
      <p>
        Maison Luma ne saurait être tenue responsable de l&apos;inexécution du contrat en cas de
        rupture de stock, de force majeure, ou de perturbation totale ou partielle, notamment des
        services postaux et moyens de transport.
      </p>

      <h2>Article 10 — Données personnelles</h2>
      <p>
        Le traitement des données collectées dans le cadre de la commande est décrit dans notre{' '}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Article 11 — Litiges &amp; médiation</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
        sera recherchée en priorité. À défaut, le client peut recourir gratuitement à un médiateur
        de la consommation. Conformément à la réglementation européenne, une plateforme de règlement
        en ligne des litiges est disponible à l&apos;adresse{' '}
        <a href="https://ec.europa.eu/consumers/odr">ec.europa.eu/consumers/odr</a>.
      </p>
    </LegalLayout>
  );
}
