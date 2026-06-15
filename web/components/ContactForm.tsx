'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

const SUBJECTS = ['Question sur une commande', 'Conseil produit', 'Retour ou échange', 'Presse', 'Autre'];

/**
 * Contact form. No backend endpoint in this demo — it confirms locally once
 * the required fields are filled.
 */
export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [done, setDone] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  if (done) {
    return (
      <div className="animate-fade-up rounded-3xl border border-gold/30 bg-gold/5 p-8 text-center">
        <span aria-hidden className="text-3xl text-gold">
          ✦
        </span>
        <h3 className="mt-4 font-serif text-2xl text-ink">Message envoyé</h3>
        <p className="mt-2 text-sm text-muted">
          Merci, {form.name || 'cher client'} — notre équipe vous répondra dans les plus brefs
          délais.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (form.name.trim() && form.email.trim() && form.message.trim()) setDone(true);
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="eyebrow mb-2 block">
            Nom complet *
          </label>
          <input id="name" required value={form.name} onChange={set('name')} className="input-luxe" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="eyebrow mb-2 block">
            Adresse e-mail *
          </label>
          <input id="email" type="email" required value={form.email} onChange={set('email')} className="input-luxe" autoComplete="email" />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="eyebrow mb-2 block">
          Sujet
        </label>
        <select id="subject" value={form.subject} onChange={set('subject')} className="select-luxe">
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="eyebrow mb-2 block">
          Votre message *
        </label>
        <textarea
          id="message"
          required
          rows={6}
          value={form.message}
          onChange={set('message')}
          className="input-luxe resize-y"
        />
      </div>

      <Button type="submit" size="lg">
        Envoyer le message
      </Button>
    </form>
  );
}
