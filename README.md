# Keres Website

![Hugo](https://img.shields.io/badge/Hugo-FF4088?style=flat&logo=hugo&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Live](https://img.shields.io/badge/status-live-brightgreen)

The marketing/landing site for **[Keres](https://playkeres.com)**, an
original abstract strategy game. Built with [Hugo](https://gohugo.io) +
[Tailwind CSS](https://tailwindcss.com), deployed on Cloudflare Pages.

🎮 **[playkeres.com](https://playkeres.com)**

---

## Part of the Keres project

Keres is split across three repositories:

| Repo                                                                       | What                                    | License    |
|-----------------------------------------------------------------------------|------------------------------------------|------------|
| [keres](https://github.com/VincentChalnot/keres)                             | Rust game engine + Negamax AI            | GPLv3      |
| [keres-platform](https://github.com/VincentChalnot/keres-platform)           | Symfony backend + TypeScript/SVG client  | Proprietary |
| **keres-website** (this repo)                                                | Hugo marketing site (playkeres.com)      | Proprietary |

This site is purely static and holds no game logic. Its only coupling to
the platform is a handful of outbound links ("Play now", login, the contact
form) built at Hugo build time from `baseURL` — see
`layouts/partials/platform-url.html`, which derives the platform origin
(`app.playkeres.com`) by prefixing the site's own `baseURL`
(`playkeres.com`) with `app.`. There is no runtime env var wiring the two
together; the derivation is purely a build-time string transform per Hugo
environment (`config/development/`, `config/production/`).

## Stack

- **Hugo** (extended) — static site generator, multilingual (`en`/`fr` via
  `i18n/`)
- **Tailwind CSS** + PostCSS — processed through Hugo's asset pipeline
  (`assets/css/main.css`, `postcss.config.js`, `tailwind.config.js`)
- **Cloudflare Pages** — production hosting, builds directly from this
  repo's git history (not via GitHub Actions — CI here only validates the
  build on PRs)

## Content structure

- `content/<lang>/` — page front matter (mostly empty; content lives in
  `i18n/<lang>.toml` and is rendered by the corresponding `layouts/` template)
- `content/<lang>/blocks/` — headless content blocks for the homepage
  (hero, concept, collector's edition, author, newsletter)
- `layouts/` — page templates (`_default/`, `rules/`, `contact/`) and
  partials (navbar, footer, piece cards, lightbox, `platform-url.html`)
- `static/` — images, fonts, favicons, `_headers` (Cloudflare Pages
  response headers)
- `config/_default/`, `config/development/`, `config/production/` — Hugo
  environment configs (`baseURL` is the only value that changes between them)

## Development

```bash
# Prereqs: external Traefik on a `proxy` network, *.local.playkeres.com → 127.0.0.1
cp .env.example .env
docker network create proxy 2>/dev/null || true
docker compose up --build -d
# https://local.playkeres.com → Hugo dev server (live reload)
```

Run [keres-platform](https://github.com/VincentChalnot/keres-platform)'s
own `compose.yaml` with the same `SERVER_NAME` alongside this to exercise
the "Play now"/login/contact-form links against a real backend.

See `AGENTS.md` for build/lint commands and content-editing conventions.

## License

Proprietary — see [`LICENSE`](LICENSE). Source is public for reference; all
rights reserved.

*Solo project by [Vincent Chalnot](https://github.com/VincentChalnot).*
