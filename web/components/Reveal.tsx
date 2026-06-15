'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right' | 'scale' | 'fade';

const DIRECTION_CLASS: Record<Direction, string> = {
  up: '',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
  fade: '',
};

interface RevealProps {
  children: ReactNode;
  /** Entrance direction. */
  direction?: Direction;
  /** Stagger delay in milliseconds. */
  delay?: number;
  /** Render as a different element (defaults to a div). */
  as?: ElementType;
  className?: string;
  /** Reveal only once (default) or every time it scrolls into view. */
  once?: boolean;
}

/**
 * Wraps content in a scroll-triggered entrance animation. Uses a single
 * IntersectionObserver per instance and degrades gracefully (and instantly)
 * when `prefers-reduced-motion` is set — see globals.css.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  as: Tag = 'div',
  className = '',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // SSR-safe guard; also covers very old browsers.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${DIRECTION_CLASS[direction]} ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
