interface SpinnerProps {
  className?: string;
  label?: string;
}

/** Minimal accessible loading indicator in the brand accent. */
export function Spinner({ className = '', label = 'Chargement' }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-3 ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-section centered spinner for page/segment loading states. */
export function PageSpinner({ label = 'Chargement' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}
