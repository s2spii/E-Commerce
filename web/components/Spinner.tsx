interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Minimal accessible loading indicator in the brand accent. */
export function Spinner({ className = '', label = 'Chargement' }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-3 ${className}`}>
      <span className="relative inline-flex h-6 w-6">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-line border-t-gold" />
        <span
          className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-b-champagne"
          style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
        />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-section centered spinner for page/segment loading states. */
export function PageSpinner({ label = 'Chargement' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner label={label} />
      <span className="animate-fade-in text-xs uppercase tracking-luxe text-muted">
        Maison Luma
      </span>
    </div>
  );
}
