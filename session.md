# Session Summary (2026-01-02)

## Scope
- Added API-driven media sections (Last.fm now playing, YouTube videos, books, Strava workouts) to the homepage.
- Built server-side proxies for API calls with caching and a live-data toggle to protect quotas and keys.
- Added a minimal Eleventy blog + notes system without converting the whole site to a framework.
- Integrated Decap CMS at `/admin/` with GitHub OAuth via Cloudflare Pages Functions.
- Updated header/nav/avatar styles, badges, dark mode tuning, and blog-specific typography scoping.

## Key Decisions
- Last.fm provides music data; iTunes Search is used for album art fallback.
- Open Library supplies book data; Google Books is always used for covers.
- YouTube/Google Books/Strava API keys live server-side in Cloudflare env vars, never in the browser.
- Live data is gated by `/api/settings` using `LIVE_DATA_ENABLED`.
- Strava responses are sanitized server-side to strip all location or map fields.
- Decap CMS uses GitHub backend with custom auth endpoints (`/auth`, `/auth/callback`).
- Local admin config is handled via `CMS_ENV=local` overrides in `admin/config.yml`.
- Eleventy outputs to `dist` and passes through existing static assets unchanged.

## File Changes
- `index.html`
  - Added Now Playing, Recent Videos, Books, and Strava sections.
  - Added JS module includes for media sections.
  - Added header/nav + marquee bar and `body.home` class for scoping.

- `styles.css`
  - Added media card layouts, badges, placeholders, and dark mode adjustments.
  - Added avatar styling (grayscale + tint).
  - Scoped typography so blog pages are not affected by homepage styles.

- `scripts/lastfm.js`
  - Fetches recent tracks from Last.fm; uses iTunes Search for album art fallback.

- `scripts/youtube.js`
  - Fetches from `/api/youtube`, renders duration badges, decodes titles, caches responses.
  - Honors live data toggle from `/api/settings`.

- `scripts/books.js`
  - Fetches Open Library data, uses Google Books covers via `/api/books`.
  - Honors live data toggle from `/api/settings`.

- `scripts/strava.js`
  - Fetches `/api/strava/recent` and renders sanitized activity fields.

- `scripts/main.js`
  - Fetches `/api/settings` before triggering API modules.

- `functions/api/youtube.js`
  - Cloudflare Pages proxy for YouTube with caching.

- `functions/api/books.js`
  - Cloudflare Pages proxy for Google Books with caching.

- `functions/api/strava/recent.js`
  - Cloudflare Pages proxy for Strava with sanitization + caching.

- `functions/api/settings.js`
  - Exposes `LIVE_DATA_ENABLED` for toggling live API calls.

- `functions/auth.js`
  - OAuth init for Decap (adds Netlify-style handshake + redirect).

- `functions/auth/callback.js`
  - Exchanges code, posts success message to opener, clears state cookie.

- `admin/index.html`
  - Loads Decap CMS and sets `CMS_ENV=local` for localhost/127.0.0.1.

- `admin/config.yml`
  - GitHub backend config, media uploads, blog + notes collections.
  - `local` overrides for auth on `http://127.0.0.1:8788`.

- Eleventy files
  - `.eleventy.js`, `.eleventyignore`, `package.json`, `package-lock.json`.
  - `content/blog/` (posts, index, tags, feed).
  - `content/notes/` (notes, index, feed).
  - `content/_includes/layouts/` (base, blog-post, note, tag).

- `README.md`
  - Build/dev commands, Eleventy structure, Decap setup, OAuth steps.

- `.gitignore`
  - Added `.dev.vars`, `.wrangler/`, `.wrangler-state/`.

## Local Development
- Cloudflare Pages dev (HTML + Functions):
  ```
  npx wrangler pages dev . --ip 127.0.0.1 --port 8788
  ```
- Eleventy build:
  ```
  npm run build
  ```
- Decap CMS local OAuth:
  - GitHub OAuth app callback: `http://127.0.0.1:8788/auth/callback`
  - `.dev.vars` needs `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`.

## Cloudflare Pages Env Vars
- `YOUTUBE_API_KEY`
- `GOOGLE_BOOKS_API_KEY`
- `LIVE_DATA_ENABLED`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REFRESH_TOKEN`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Known Notes
- YouTube/Google Books quotas can block responses; caching mitigates but does not remove limits.
- Work page files were intentionally removed after experimentation.
- Wrangler requires Node v20+.
