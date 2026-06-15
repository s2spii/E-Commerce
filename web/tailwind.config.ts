import type { Config } from 'tailwindcss';

/**
 * Maison Luma — "Modern Luxe" theme.
 *
 * A cinematic take on restrained luxury: a warm ivory base, dramatic noir
 * sections, and a living champagne→gold accent. Depth comes from layered soft
 * shadows; movement from a small, reusable animation library. Colours map to
 * CSS variables defined in globals.css so they stay consistent across the app.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF7F1',
        surface: '#FFFFFF',
        sand: '#F2ECE1',
        ink: '#1A1714',
        noir: '#0E0C0A',
        muted: '#736B5E',
        gold: '#B8924A',
        champagne: '#E2C892',
        line: '#E8E1D4',
      },
      fontFamily: {
        // Bound to next/font CSS variables (see app/layout.tsx).
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
        luxe: '0.32em',
      },
      maxWidth: {
        container: '1320px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(26,23,20,0.04), 0 10px 30px -16px rgba(26,23,20,0.18)',
        lift: '0 30px 60px -32px rgba(26,23,20,0.35)',
        gold: '0 20px 45px -22px rgba(184,146,74,0.55)',
        ring: '0 0 0 1px rgba(232,225,212,0.9), 0 18px 40px -24px rgba(26,23,20,0.28)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(110deg, #B8924A 0%, #E2C892 45%, #B8924A 100%)',
        'noir-veil':
          'linear-gradient(180deg, rgba(14,12,10,0.15) 0%, rgba(14,12,10,0.55) 100%)',
        'shine':
          'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.45) 50%, transparent 75%)',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        kenburns: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '100%': { transform: 'scale(1.12) translateY(-1.5%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(120%)' },
        },
        scrollHint: {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '40%': { opacity: '1' },
          '80%, 100%': { transform: 'translateY(14px)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fadeIn 0.9s ease both',
        'scale-in': 'scaleIn 0.7s cubic-bezier(0.22,1,0.36,1) both',
        kenburns: 'kenburns 20s ease-out alternate infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        marquee: 'marquee 36s linear infinite',
        float: 'float 6s ease-in-out infinite',
        gradient: 'gradientShift 7s ease infinite',
        shine: 'shine 1.1s ease',
        'scroll-hint': 'scrollHint 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
