'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, formatPrice } from '@/lib/api';
import type { Address, CheckoutResult, CustomerType } from '@/lib/types';
import { COUNTRIES } from '@/lib/countries';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/Button';
import { PageSpinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { OrderTotals } from '@/components/OrderTotals';

type AddressForm = {
  fullName: string;
  company: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone: string;
};

const EMPTY_ADDRESS: AddressForm = {
  fullName: '',
  company: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postalCode: '',
  countryCode: 'FR',
  phone: '',
};

function toApiAddress(form: AddressForm): Address {
  return {
    fullName: form.fullName.trim(),
    company: form.company.trim() || undefined,
    line1: form.line1.trim(),
    line2: form.line2.trim() || undefined,
    city: form.city.trim(),
    region: form.region.trim() || undefined,
    postalCode: form.postalCode.trim(),
    countryCode: form.countryCode,
    phone: form.phone.trim() || undefined,
  };
}

export default function CheckoutPage() {
  const { profile, loading: authLoading } = useRequireAuth();
  const { cart, loading: cartLoading, refresh } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [customerType, setCustomerType] = useState<CustomerType>('B2C');
  const [vatNumber, setVatNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((a) => ({ ...a, [key]: e.target.value }));

  // Re-price the cart whenever the tax-relevant context changes so the summary
  // reflects the destination country / B2B reverse-charge accurately.
  useEffect(() => {
    if (!profile) return;
    refresh({
      country: address.countryCode,
      customerType,
      vatNumber: customerType === 'B2B' && vatNumber ? vatNumber : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, address.countryCode, customerType, vatNumber]);

  const cartEmpty = !cart || cart.items.length === 0;

  const canSubmit = useMemo(
    () =>
      Boolean(
        address.fullName &&
          address.line1 &&
          address.city &&
          address.postalCode &&
          address.countryCode &&
          (customerType !== 'B2B' || vatNumber.trim()) &&
          !cartEmpty,
      ),
    [address, customerType, vatNumber, cartEmpty],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1) Create the order from the active cart.
      const order = await api<CheckoutResult>('/orders/checkout', {
        method: 'POST',
        body: {
          shippingAddress: toApiAddress(address),
          customerType,
          ...(customerType === 'B2B' && vatNumber ? { vatNumber: vatNumber.trim() } : {}),
        },
      });

      // 2) Simulate payment capture (demo flow).
      try {
        await api<{ id: string; status: string }>(`/orders/${order.id}/pay`, { method: 'POST' });
      } catch {
        // Payment simulation failed — the order still exists as PENDING.
      }

      // 3) The cart is now converted; reset our local cart state.
      await refresh();
      router.push(`/compte/commandes/${order.id}?placed=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'La commande n’a pas pu être finalisée.');
      setSubmitting(false);
    }
  };

  if (authLoading || !profile || cartLoading) return <PageSpinner />;

  if (cartEmpty) {
    return (
      <div className="container-luxe py-20">
        <h1 className="mb-10 text-center text-5xl">Commande</h1>
        <EmptyState title="Votre panier est vide" description="Ajoutez des articles avant de commander.">
          <Button href="/boutique" variant="secondary">
            Explorer la boutique
          </Button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-luxe py-14">
      <header className="mb-10 border-b border-line pb-8">
        <span className="eyebrow">Finaliser</span>
        <h1 className="mt-3 text-5xl">Commande</h1>
      </header>

      <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1fr_380px]">
        {/* Shipping + customer type */}
        <div className="space-y-10">
          <section>
            <h2 className="mb-6 text-2xl">Adresse de livraison</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom complet *" className="col-span-2">
                <input required value={address.fullName} onChange={set('fullName')} className="input-luxe" autoComplete="name" />
              </Field>
              <Field label="Société" className="col-span-2">
                <input value={address.company} onChange={set('company')} className="input-luxe" autoComplete="organization" />
              </Field>
              <Field label="Adresse *" className="col-span-2">
                <input required value={address.line1} onChange={set('line1')} className="input-luxe" autoComplete="address-line1" />
              </Field>
              <Field label="Complément d’adresse" className="col-span-2">
                <input value={address.line2} onChange={set('line2')} className="input-luxe" autoComplete="address-line2" />
              </Field>
              <Field label="Code postal *">
                <input required value={address.postalCode} onChange={set('postalCode')} className="input-luxe" autoComplete="postal-code" />
              </Field>
              <Field label="Ville *">
                <input required value={address.city} onChange={set('city')} className="input-luxe" autoComplete="address-level2" />
              </Field>
              <Field label="Région / État">
                <input value={address.region} onChange={set('region')} className="input-luxe" autoComplete="address-level1" />
              </Field>
              <Field label="Pays *">
                <select
                  value={address.countryCode}
                  onChange={(e) => setAddress((a) => ({ ...a, countryCode: e.target.value }))}
                  className="select-luxe"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Téléphone" className="col-span-2">
                <input value={address.phone} onChange={set('phone')} className="input-luxe" autoComplete="tel" type="tel" />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-2xl">Type de client</h2>
            <div className="flex gap-4">
              {(['B2C', 'B2B'] as CustomerType[]).map((type) => (
                <label
                  key={type}
                  className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-sm transition-all duration-300 ${
                    customerType === type
                      ? 'border-gold bg-gold/10 text-gold shadow-sm'
                      : 'border-line text-ink hover:border-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="customerType"
                    value={type}
                    checked={customerType === type}
                    onChange={() => setCustomerType(type)}
                    className="accent-gold"
                  />
                  {type === 'B2C' ? 'Particulier' : 'Professionnel'}
                </label>
              ))}
            </div>

            {customerType === 'B2B' ? (
              <Field label="Numéro de TVA intracommunautaire *" className="mt-5">
                <input
                  required
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="input-luxe uppercase"
                  placeholder="FR12345678901"
                />
              </Field>
            ) : null}
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-6 rounded-3xl border border-line bg-surface p-7 shadow-soft lg:sticky lg:top-28">
          <h2 className="text-2xl">Votre commande</h2>

          <ul className="space-y-3 border-b border-line pb-5 text-sm">
            {cart!.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="text-muted">
                  {item.name}
                  {item.variantName ? ` · ${item.variantName}` : ''} × {item.quantity}
                </span>
                <span className="shrink-0 text-ink">
                  {formatPrice(item.lineTotalInclTax, cart!.currency)}
                </span>
              </li>
            ))}
          </ul>

          <OrderTotals totals={cart!.totals} currency={cart!.currency} />

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <Button type="submit" fullWidth size="lg" disabled={!canSubmit || submitting}>
            {submitting ? 'Traitement…' : 'Payer et commander'}
          </Button>
          <p className="text-center text-xs text-muted">
            Paiement simulé pour cette démonstration.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="eyebrow mb-2 block">{label}</label>
      {children}
    </div>
  );
}
