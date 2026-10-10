/**
 * Keres Tailwind preset. Both the website and the platform load it:
 *
 *   presets: [require('@keres/design-system/tailwind.preset')]
 *
 * Every value points at a CSS variable from src/tokens.css, so changing a
 * token re-themes both apps. Do not add raw hex colours to components.
 */
const rgb = (name) => `rgb(var(--k-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [require('@tailwindcss/typography')],
  theme: {
    extend: {
      colors: {
        canvas: rgb('canvas'),
        sunken: rgb('sunken'),
        inactive: rgb('inactive'),
        surface: { DEFAULT: rgb('surface'), hover: rgb('surface-hover') },
        line: rgb('line'),
        edge: rgb('edge'),
        fg: rgb('fg'),
        soft: rgb('soft'),
        muted: rgb('muted'),
        subtle: rgb('subtle'),
        ink: rgb('ink'),
        primary: { DEFAULT: rgb('primary'), hover: rgb('primary-hover') },
        brand: rgb('brand'),
        success: rgb('success'),
        danger: { DEFAULT: rgb('danger'), text: rgb('danger-text') },
        warning: rgb('warning'),
        info: rgb('info'),
        tile: { dark: rgb('tile-dark'), light: rgb('tile-light'), stroke: rgb('tile-stroke') },
        piece: { light: rgb('piece-light'), dark: rgb('piece-dark') },
        // Legacy aliases used by the Hugo templates (bg-keres-primary …).
        keres: {
          primary: rgb('primary'),
          secondary: rgb('soft'),
          light: rgb('fg'),
          dark: rgb('brand'),
          bg: rgb('canvas'),
          surface: rgb('surface'),
        },
      },
      fontFamily: {
        sans: 'var(--k-font-sans)',
        display: 'var(--k-font-display)',
        title: 'var(--k-font-title)',
        mono: 'var(--k-font-mono)',
        // Legacy aliases.
        carolingia: 'var(--k-font-display)',
        roman: 'var(--k-font-title)',
      },
      fontSize: {
        h1: ['6rem', { lineHeight: '1.1' }],
        'h1-lg': ['8rem', { lineHeight: '1.1' }],
        h2: ['3rem', { lineHeight: '1.1' }],
        h3: ['2rem', { lineHeight: '1.1' }],
        h4: ['1.5rem', { lineHeight: '1.1' }],
        h5: ['1.2rem', { lineHeight: '1.1' }],
        // Legacy alias.
        'h1-sm': ['8rem', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm: 'var(--k-radius-sm)',
        md: 'var(--k-radius-md)',
        lg: 'var(--k-radius-lg)',
        rounded: '9999px',
      },
      boxShadow: {
        raised: 'var(--k-shadow-raised)',
        modal: 'var(--k-shadow-modal)',
        cta: 'var(--k-shadow-cta)',
      },
      maxWidth: {
        container: 'var(--k-container)',
        section: 'var(--k-container-narrow)',
        hero: 'var(--k-hero-measure)',
      },
      height: { navbar: 'var(--k-navbar-h)' },
      spacing: { navbar: 'var(--k-navbar-h)' },
      zIndex: { navbar: '100', dropdown: '200', modal: '1000', lightbox: '9000' },
      keyframes: {
        'k-pop': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'k-indeterminate': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(250%)' } },
      },
      animation: { pop: 'k-pop 0.2s ease', indeterminate: 'k-indeterminate 1.4s ease-in-out infinite' },
    },
  },
};
