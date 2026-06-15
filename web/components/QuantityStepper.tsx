'use client';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

/** Compact +/- stepper used on the product page and in the cart. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className = '',
}: QuantityStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <div className={`inline-flex items-center border border-line bg-surface ${className}`}>
      <button
        type="button"
        aria-label="Diminuer la quantité"
        className="px-3 py-2 text-ink transition-colors hover:text-gold disabled:opacity-40"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Quantité"
        className="w-12 border-x border-line bg-transparent py-2 text-center text-sm text-ink focus:outline-none"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onChange(clamp(next));
        }}
      />
      <button
        type="button"
        aria-label="Augmenter la quantité"
        className="px-3 py-2 text-ink transition-colors hover:text-gold disabled:opacity-40"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
      >
        +
      </button>
    </div>
  );
}
