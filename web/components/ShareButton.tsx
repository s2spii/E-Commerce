'use client';

import { useToast } from '@/context/ToastContext';

/**
 * Shares the current page via the Web Share API where available (mobile),
 * otherwise copies the URL to the clipboard and confirms with a toast.
 */
export function ShareButton({ title, className = '' }: { title?: string; className?: string }) {
  const { toast } = useToast();

  const onClick = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: title ?? document.title, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast('Lien copié dans le presse-papier', 'success');
      }
    } catch {
      /* user cancelled the share sheet, or clipboard was blocked */
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Partager cette pièce"
      className={`inline-flex items-center gap-2 rounded-full border border-line px-5 py-3.5 text-xs uppercase tracking-widest text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-ink ${className}`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" strokeLinecap="round" />
      </svg>
      Partager
    </button>
  );
}
