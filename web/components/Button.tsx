import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-sans uppercase tracking-widest transition-all duration-300 ease-luxe disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory hover:bg-gold',
  secondary: 'border border-ink text-ink hover:border-gold hover:text-gold',
  ghost: 'text-ink hover:text-gold',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-6 py-3 text-xs',
  lg: 'px-8 py-4 text-xs',
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
 * a native `<button>`. Styling follows the maison's restrained aesthetic:
 * uppercase, wide tracking, gold accent on hover.
 */
export function Button(props: ButtonProps | AnchorProps) {
  if ('href' in props && props.href) {
    const { href, variant = 'primary', size = 'md', fullWidth, className, children } = props;
    return (
      <Link href={href} className={classes(variant, size, fullWidth, className)}>
        {children}
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
      {children}
    </button>
  );
}
