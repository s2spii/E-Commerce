import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = { title: 'Contact' };

const DETAILS = [
  { label: 'Par e-mail', value: '[contact@maisonluma.example]', hint: 'Réponse sous 24–48 h ouvrées' },
  { label: 'Par téléphone', value: '[+33 (0)1 00 00 00 00]', hint: 'Du lundi au vendredi, 10 h – 18 h' },
  { label: 'Atelier & siège', value: '[Adresse du siège social]', hint: 'Sur rendez-vous uniquement' },
];

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact"
      intro="Une question, un conseil, une demande particulière ? Notre équipe vous accompagne avec la même exigence que nos pièces."
      bare
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr]">
        {/* Coordinates */}
        <div className="space-y-4">
          {DETAILS.map((d) => (
            <div key={d.label} className="card-luxe p-6">
              <p className="text-xs uppercase tracking-luxe text-gold">{d.label}</p>
              <p className="mt-2 font-serif text-lg text-ink">{d.value}</p>
              <p className="mt-1 text-sm text-muted">{d.hint}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-line bg-surface p-7 shadow-soft sm:p-8">
          <h2 className="mb-6 font-serif text-2xl">Écrivez-nous</h2>
          <ContactForm />
        </div>
      </div>
    </LegalLayout>
  );
}
