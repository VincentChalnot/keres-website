# Keres design system

One Tailwind-based stylesheet shared by the **website** (Hugo) and the **platform** (Symfony + Vite).
It replaces Bulma and the hand-written SCSS of the platform.

```bash
cd design-system
npm ci
npm run build        # → dist/keres.css (+ styleguide/keres.css)
npm run styleguide   # → http://localhost:4173  (the demo page with every component)
npm run dev          # rebuild the style guide CSS on change
```

## Layout

| Path | Role |
|---|---|
| `src/tokens.css` | **All design tokens** as CSS variables (colours as RGB triplets, fonts, radii, shadows, layout metrics). The only place a hex value may appear. |
| `tailwind.preset.js` | Maps tokens to Tailwind names (`bg-surface`, `text-muted`, `border-line`, `rounded-lg`, `font-title`…). Both apps use it as a preset. Legacy `keres-*` colour aliases are kept for the Hugo templates. |
| `src/base.css` | Fonts, element defaults (h1–h6, links, lists…). |
| `src/components/*.css` | Components (`@layer components`, built with `@apply` on token-based utilities). |
| `styleguide/index.html` | Static demo page: tokens, every component and state, realistic page compositions. |

### Conventions

- Block / `block__element` / `block--modifier` naming (as already used by the platform: `site-navbar__logo`, `game-header--compact`).
- **State classes are `is-*`** (`is-active`, `is-unread`, `is-flipped`…) and ARIA attributes, so the existing TypeScript keeps working. Toggle buttons use `aria-pressed` instead of toggling `is-primary`/`is-outlined`.
- Layout (columns, spacing, flex) is done with plain Tailwind utilities in templates — there is no `columns`/`level`/`mb-3` replacement.
- Components never use raw colours; add or change a token instead.

## Using it from an app

```js
// tailwind.config.js
module.exports = {
  presets: [require('<path-to>/design-system/tailwind.preset')],
  content: ['./templates/**/*.twig', './assets/**/*.{ts,js}'],   // or ./layouts/**/*.html
};
```
```css
/* app css entry */
@import "<path-to>/design-system/src/keres.css";
```

Fonts are referenced as `/fonts/carolingia.ttf` and `/fonts/RomanSerif.ttf` (served from each app's public root, as today) and piece icons as `/images/pieces/*.svg`.
Both apps need `tailwindcss@3.4`, `@tailwindcss/typography` and the standard PostCSS setup (Hugo already has it; the Vite platform needs `tailwindcss` + `autoprefixer`).

### How to share it (decision pending)

| Option | Pros | Cons |
|---|---|---|
| **Own repo `keres-design-system` + npm package** (GitHub Packages) | Versioned, each app pins a version, same flow for Hugo and Vite (`npm i @keres/design-system`) | A third repo and a publish step |
| **Git submodule** in both repos | No registry, source visible | Submodule friction in CI/Docker/Cloudflare Pages |
| **Precompiled `dist/keres.css`** copied or fetched at build time | Zero toolchain in the consumer | No per-app utility generation; stale copies |

Recommended: own repo published as an npm package, consumed with the preset + `@import` (utilities are then generated from each app's own templates). This directory is already self-contained so it can be moved as-is (`git subtree split -P design-system`).

## Bulma → Keres mapping (platform migration)

| Bulma (current) | Keres |
|---|---|
| `button is-rounded is-primary` | `btn btn--primary` |
| `button is-rounded is-outlined is-light` | `btn btn--outline` |
| `button is-rounded is-light` | `btn btn--light` |
| `button is-danger` / `is-danger is-light` | `btn btn--danger` / `btn btn--danger-soft` |
| `button is-info`, `is-text`, `is-static` | `btn--info`, `btn--text`, `btn--static` |
| `is-small` / `is-large` / `is-fullwidth` | `btn--sm` / `btn--lg` / `btn--block` |
| `buttons` / `buttons has-addons` / `is-centered` | `btn-group` / `btn-group--joined` / `btn-group--center` |
| lobby preset `is-primary`↔`is-outlined` toggle | `aria-pressed="true"` on `btn--outline` |
| `delete` | `btn-close` |
| `box` | `card` (`card__title` replaces `title is-5`) |
| `title` / `subtitle` (page) | `page-title` / `page-subtitle` |
| `heading` | `eyebrow` (`stat__label` in stats) |
| `level` + `level-item` + `heading`/`title` | `stat-row` > `stat` > `stat__label` / `stat__value` |
| `columns` / `column is-*` | Tailwind `grid`, `grid-cols-*`, `gap-*` |
| `container` / `section` | `container-page` / `section` |
| `field` / `control` / `label` / `help` | `field` / *(no wrapper)* / `label` / `help` (`help--danger`) |
| `input` / `textarea` / `select` (wrapped in `div.select`) | `input` / `textarea` / `select` (on the `<select>`) |
| `checkbox` / `radio` / `field has-addons` | `checkbox` / `radio` / `input-group` |
| `tag is-rounded is-*` / `is-light` | `tag tag--*` / `tag--soft tag--*` (`is-white`→`tag--white`, `is-dark`→`tag--brand`) |
| `notification is-*` | `alert alert--*` |
| `modal`, `modal-background`, `modal-card(-head/-title/-body/-foot)` | `modal`, `modal__backdrop`, `modal__card`, `modal__head/__title/__body/__foot` (`is-active` unchanged) |
| `table`, `table-container`, `is-fullwidth` | `table`, `table-wrap` |
| `tabs > ul > li.is-active > a` | `tabs > a.tab.is-active` |
| `menu`, `menu-label`, `menu-list`, `a.is-active` | `menu`, `menu__label`, `menu__list`, `menu__link.is-active` |
| `pagination-previous/-next/-list/-link/-ellipsis` | `pagination__prev/__next/__list/__link/__ellipsis` |
| `progress is-small is-primary` | `progress progress--sm` |
| `navbar*`, `site-navbar*` | `navbar`, `navbar__brand/__logo/__burger/__menu/__start/__end/__link/__icon` |
| `notification-bell*` / `notification-list*` | `bell*` / `notif*` |
| `language-switcher*` | `lang-switch*` |
| `game-status-banner is-*` | `status-banner status-banner--*` |
| `player-info-row` | `player-row` |
| `has-text-grey(-light)` / `has-text-centered` / `is-size-7` | `text-muted` / `text-subtle` / `text-center` / `text-xs` |
| `is-hidden`, `is-flex`, `mt-3`… | `hidden`, `flex`, `mt-3` (Tailwind) |

Not covered (kept as is): the e-mail templates (inline styles by necessity), the SVG sprite / board geometry and the Three.js view.
`#board-container` becomes `.board` (+ `.board-svg` for the tile and piece colours, now token-driven).
