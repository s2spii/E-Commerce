import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      title="Mentions légales"
      updatedAt="15 juin 2026"
      intro="Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, voici les informations relatives à l'éditeur et à l'hébergeur du présent site."
    >
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>Maison Luma</strong> est édité par :
      </p>
      <ul>
        <li>Raison sociale : [Raison sociale]</li>
        <li>Forme juridique : [Forme juridique] au capital de [Capital social] €</li>
        <li>Siège social : [Adresse du siège social]</li>
        <li>SIRET : [SIRET] — RCS [Ville]</li>
        <li>N° de TVA intracommunautaire : [N° TVA]</li>
        <li>Adresse e-mail : [contact@maisonluma.example]</li>
        <li>Téléphone : [+33 (0)1 00 00 00 00]</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>Le directeur de la publication est [Nom du directeur de la publication].</p>

      <h2>Hébergeur</h2>
      <p>
        Le site est hébergé par [Nom de l&apos;hébergeur], [Adresse de l&apos;hébergeur],
        [téléphone / site web de l&apos;hébergeur].
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (textes, visuels, logos, photographies, identité de
        marque) est la propriété exclusive de Maison Luma ou de ses partenaires, et est protégé par
        le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation,
        totale ou partielle, sans autorisation écrite préalable est interdite et constituerait une
        contrefaçon.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Maison Luma met tout en œuvre pour offrir des informations fiables et à jour. Toutefois, des
        erreurs ou omissions peuvent survenir. L&apos;éditeur ne saurait être tenu responsable des
        dommages directs ou indirects résultant de l&apos;accès ou de l&apos;utilisation du site.
      </p>

      <h2>Données personnelles &amp; cookies</h2>
      <p>
        Le traitement de vos données est détaillé dans notre{' '}
        <Link href="/confidentialite">politique de confidentialité</Link> et notre{' '}
        <Link href="/cookies">politique de cookies</Link>.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative au site, vous pouvez nous écrire via la page{' '}
        <Link href="/contact">Contact</Link>.
      </p>
    </LegalLayout>
  );
}
