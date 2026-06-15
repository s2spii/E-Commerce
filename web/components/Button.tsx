import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

// Pill-shaped, with a gold fill that slides up on hover, a soft light "shine"
// sweep (::after) and a gentle lift. Children sit above the fill via z-10.
const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-sans uppercase tracking-widest transition-all duration-500 ease-spring disabled:cursor-not-allowed disabled:opacity-50 ' +
  'before:absolute before:inset-0 before:z-0 before:translate-y-full before:bg-gold-gradient before:transition-transform before:duration-500 before:ease-spring hover:before:translate-y-0 ' +
  'after:pointer-events-none after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/35 after:to-transparent after:transition-transform after:duration-700 after:ease-luxe hover:after:translate-x-full';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory shadow-soft hover:-translate-y-0.5 hover:text-ink hover:shadow-gold',
  secondary:
    'border border-ink/70 text-ink hover:-translate-y-0.5 hover:border-gold hover:text-ink hover:shadow-gold',
  ghost: 'text-ink hover:text-gold before:hidden after:hidden',
};

const sizes: Record<Size, string> = {
  sm: 'px-5 py-2.5 text-[11px]',
  md: 'px-7 py-3.5 text-xs',
  lg: 'px-9 py-4 text-xs',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = CommonProps & { href: string };

function classes(variant: Variant, size: Size, fullWidth?: boolean, extra?: string): string {
  return [base, variants[variant], sizes[size], fullWidth ? 'w-full' : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Primary CTA component. Renders a Next `<Link>` when given an `href`, otherwise
 * a native `<button>`. Styling follows the maison's modern-luxe aesthetic:
 * pill-shaped, uppercase, wide tracking, with a gold fill + shine on hover.
 * Label is wrapped so it stays above the animated fill layer.
 */
export function Button(props: ButtonProps | AnchorProps) {
  if ('href' in props && props.href) {
    const { href, variant = 'primary', size = 'md', fullWidth, className, children } = props;
    return (
      <Link href={href} className={classes(variant, size, fullWidth, className)}>
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </Link>
    );
  }

  const {
    variant = 'primary',
    size = 'md',
    fullWidth,
    className,
    children,
    type = 'button',
    ...rest
  } = props as ButtonProps;

  return (
    <button type={type} className={classes(variant, size, fullWidth, className)} {...rest}>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
