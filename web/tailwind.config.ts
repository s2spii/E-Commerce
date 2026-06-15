import type { Config } from 'tailwindcss';

/**
 * Maison Luma theme — a restrained luxury palette with a serif display face
 * for headings and Inter for UI/body. Colours map to CSS variables defined in
 * globals.css so they stay consistent across the app.
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
        ivory: '#FAF8F4',
        surface: '#FFFFFF',
        ink: '#1A1A1A',
        muted: '#6B6B6B',
        gold: '#B8924A',
        line: '#E7E2D8',
      },
      fontFamily: {
        // Bound to next/font CSS variables (see app/layout.tsx).
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
      maxWidth: {
        container: '1280px',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
