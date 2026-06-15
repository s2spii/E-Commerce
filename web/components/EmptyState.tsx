import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode; // optional CTA(s)
}

/** Friendly placeholder for empty lists and error fallbacks. */
export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-line bg-surface px-6 py-16 text-center">
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      {description ? <p className="mt-3 max-w-md text-sm text-muted">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
