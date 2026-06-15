import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

export default function ConfidentialitePage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      updatedAt="15 juin 2026"
      intro="Maison Luma accorde une importance majeure à la protection de vos données personnelles. La présente politique décrit, conformément au Règlement Général sur la Protection des Données (RGPD), les traitements que nous mettons en œuvre."
    >
      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement est [Raison sociale], dont le siège social est situé [Adresse du
        siège social]. Pour toute question, vous pouvez contacter notre délégué à la protection des
        données à l&apos;adresse [dpo@maisonluma.example].
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Données d&apos;identification : nom, prénom, adresse e-mail, téléphone.</li>
        <li>Données de livraison et de facturation : adresse postale, pays, numéro de TVA (B2B).</li>
        <li>Données de commande : produits achetés, montants, historique.</li>
        <li>Données techniques : adresse IP, données de navigation et cookies.</li>
      </ul>

      <h2>Finalités &amp; bases légales</h2>
      <ul>
        <li>Gestion des commandes et de la relation client (exécution du contrat).</li>
        <li>Gestion du compte et de l&apos;authentification (exécution du contrat).</li>
        <li>Envoi d&apos;informations commerciales (consentement).</li>
        <li>Amélioration du site et mesure d&apos;audience (intérêt légitime / consentement).</li>
        <li>Respect des obligations légales et comptables (obligation légale).</li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Vos données sont conservées pour la durée nécessaire aux finalités poursuivies : la durée de
        la relation contractuelle pour les données client, puis la durée légale de prescription pour
        les données de facturation. Les données de prospection sont conservées trois (3) ans à
        compter du dernier contact.
      </p>

      <h2>Destinataires</h2>
      <p>
        Vos données sont destinées aux services internes de Maison Luma et à nos sous-traitants
        (hébergeur, prestataire de paiement, transporteurs), tenus à une obligation de
        confidentialité. Elles ne sont jamais vendues à des tiers.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité de vos données, ainsi
        que du droit de définir des directives relatives à leur sort après votre décès. Vous pouvez
        exercer ces droits via la page <Link href="/contact">Contact</Link> ou par e-mail.
      </p>
      <p>
        Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr">www.cnil.fr</a>).
      </p>

      <h2>Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement,
        contrôle d&apos;accès, authentification à deux facteurs) afin de protéger vos données contre
        tout accès non autorisé, perte ou altération.
      </p>

      <h2>Cookies</h2>
      <p>
        L&apos;utilisation des cookies est détaillée dans notre{' '}
        <Link href="/cookies">politique de cookies</Link>.
      </p>
    </LegalLayout>
  );
}
