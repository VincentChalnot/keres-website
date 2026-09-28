# AGENTS.md — Keres Website (Hugo)

## Scope

This repository is the whole scope for this agent — the static marketing
site only. It used to be the `website/` folder of a monorepo shared with
the Symfony platform and the Rust engine; those now live in separate
repositories ([keres-platform](https://github.com/VincentChalnot/keres-platform),
[keres](https://github.com/VincentChalnot/keres)). This repo has **no
runtime dependency on either** — it's a static site with no server-side
logic. Its only coupling is a handful of outbound links built at Hugo
build time (see below); do not add environment-variable wiring to the
platform beyond what already exists.

## Project overview

Purely static, no game logic, no backend of its own. Two languages
(`en`/`fr`) via Hugo's i18n, content driven mostly by translation strings
(`i18n/<lang>.toml`) rather than Markdown body content — most `content/`
files are near-empty front matter that selects a layout.

Pages:

- `/` — homepage (`content/<lang>/_index.md`, headless blocks in
  `content/<lang>/blocks/`: hero, concept, collector's edition, author,
  newsletter signup)
- `/rules` — game rules (`layouts/rules/single.html`, fully i18n-driven —
  piece cards rendered via `layouts/partials/piece-card.html`)
- `/contact` — contact form (`layouts/contact/single.html`) that POSTs
  JSON directly to the platform's `/api/contact` endpoint client-side
- `/legal-notice`, `/terms-of-use`, `/privacy-policy`, `/trust` — via
  `i18n_legal`/`i18n_cgu`/`i18n_privacy`/`i18n_trust` shortcodes

### The `platform-url.html` partial

`layouts/partials/platform-url.html` derives the Symfony app's origin
(`https://app.<domain>`) from the site's own `baseURL`
(`https://<domain>/`, set per-environment in `config/<env>/config.toml`) by
string-replacing `://` with `://app.`. Every link into the platform ("Play
now", login, contact form's POST target) goes through this partial. **Do
not hardcode `app.playkeres.com` or `local.playkeres.com` anywhere** —
always call the partial, so the domain stays defined exactly once.

## Conventions

- **Content goes in `i18n/<lang>.toml`, not inline in layouts.** Every
  user-facing string is an i18n key referenced via `{{ i18n "key" }}` (or
  `{{ i18n "key" (dict ...) }}` for pieces with placeholders — see
  `piece-card.html` usage in `layouts/rules/single.html`). Adding text to a
  layout directly (instead of an i18n key) breaks translation parity.
- **Keep `en.toml` and `fr.toml` in lockstep.** Both currently have the
  same key count (270) — adding a key to one without the other leaves a
  raw key rendered on the missing-language page.
- **Images**: `static/images/`, referenced as absolute paths (`/images/...`)
  since Hugo serves `static/` at the site root. `static/_headers` sets
  aggressive caching for `/fonts/*` and `/images/*` — bump the filename
  (not just content) if an asset needs cache-busting on Cloudflare Pages.
- **Tailwind** via Hugo's PostCSS pipeline (`assets/css/main.css`,
  `postcss.config.js`, `tailwind.config.js`) — do not add a separate build
  step; Hugo's resource pipeline (`resources.PostCSS`) handles it using
  `node_modules` from this repo's `package.json`.
- **No JavaScript framework.** The one piece of client-side JS
  (`layouts/contact/single.html`'s inline contact-form handler) is vanilla,
  inline, and uses Hugo's `jsonify`/`safeJS` template functions to safely
  embed the computed platform URL — follow that pattern for any new
  client-side interactivity rather than introducing a bundler.

## Dev commands

```bash
# Docker (recommended — matches CI's Hugo version exactly)
cp .env.example .env
docker network create proxy 2>/dev/null || true
docker compose up --build -d
# https://local.playkeres.com (SERVER_NAME in .env)

# Host, if you have Hugo extended + Node installed locally
npm ci
hugo server --environment development --buildDrafts

# Production build check (what CI runs)
npm ci
hugo --environment production --minify --gc
```

Cloudflare Pages builds and deploys directly from this repo's git history
on push to `main` — it is **not** wired through GitHub Actions. CI here
(`.github/workflows/ci.yaml`) only validates that the production build
succeeds on every push/PR; it does not deploy anything.

## Testing changes

This is a static site — "testing" means building it and looking at the
result:

```bash
hugo server --environment development --buildDrafts
# then open https://local.playkeres.com (or http://localhost:1313 if
# running outside Docker) and click through the changed page(s) in both
# /en/ and /fr/
```

For rules-page changes specifically, check both the piece grid rendering
(`layouts/partials/piece-card.html`) and that the i18n keys you touched
exist in **both** `i18n/en.toml` and `i18n/fr.toml`.
