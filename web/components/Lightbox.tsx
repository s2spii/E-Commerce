'use client';

import Image from 'next/image';
import { useCallback, useEffect } from 'react';
import type { ProductImage } from '@/lib/types';

interface LightboxProps {
  images: ProductImage[];
  index: number;
  open: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Fullscreen image viewer with keyboard + arrow navigation. */
export function Lightbox({ images, index, open, onIndexChange, onClose }: LightboxProps) {
  const count = images.length;

  const prev = useCallback(
    () => onIndexChange((index - 1 + count) % count),
    [index, count, onIndexChange],
  );
  const next = useCallback(() => onIndexChange((index + 1) % count), [index, count, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, prev, next]);

  const current = images[index];

  return (
    <div
      className={`fixed inset-0 z-[75] flex items-center justify-center bg-noir/90 backdrop-blur-md transition-opacity duration-300 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Galerie en plein écran"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-all hover:rotate-90 hover:border-gold hover:text-gold"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      {count > 1 ? (
        <>
          <NavButton side="left" onClick={(e) => { e.stopPropagation(); prev(); }} />
          <NavButton side="right" onClick={(e) => { e.stopPropagation(); next(); }} />
        </>
      ) : null}

      {/* Image */}
      <div
        className="relative h-[78vh] w-[88vw] max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {current?.url ? (
          <Image
            key={index}
            src={current.url}
            alt={current.alt ?? 'Image produit'}
            fill
            sizes="88vw"
            className="animate-fade-in object-contain"
          />
        ) : null}
      </div>

      {count > 1 ? (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ivory/10 px-4 py-1.5 text-xs tabular-nums text-ivory">
          {index + 1} / {count}
        </div>
      ) : null}
    </div>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: 'left' | 'right';
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Image précédente' : 'Image suivante'}
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/20 text-ivory transition-all hover:border-gold hover:text-gold ${
        side === 'left' ? 'left-4 sm:left-8' : 'right-4 sm:right-8'
      }`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        {side === 'left' ? (
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
