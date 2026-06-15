import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode; // optional CTA(s)
}

/** Friendly placeholder for empty lists and error fallbacks. */
export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-3xl border border-line bg-surface px-6 py-20 text-center shadow-soft">
      <span
        aria-hidden
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sand text-2xl text-gold"
      >
        ✦
      </span>
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      {description ? <p className="mt-3 max-w-md text-sm text-muted">{description}</p> : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  );
}
