# Session Summary (2026-01-02)

## Scope
- Added API-driven media sections (Last.fm now playing, YouTube videos, books) to the homepage.
- Built client-side UI for cards, placeholders, badges, and status messaging.
- Switched YouTube and Google Books API calls to Cloudflare Pages Functions proxies.
- Added a live data toggle via `/api/settings` using `LIVE_DATA_ENABLED`.
- Implemented caching to reduce API quota usage.
- Updated header styling to match new navigation/avatar layout.

## Key Decisions
- Use Last.fm for music data; add iTunes Search for album art fallback.
- Use Open Library for reading data with Google Books for covers (always prefer Google Books when available).
- YouTube + Google Books API keys live in Cloudflare Pages environment variables (not in Git/browser).
- Live data can be toggled on/off via Cloudflare env vars and `.dev.vars`.
- Avatar is grayscale with subtle site-color tint (adjusted for brightness).

## File Changes
- `index.html`
  - Added Now Playing, Recent Videos, and Books sections with status lines.
  - Added JS module includes.
  - Updated header markup to include avatar + Work/About links.

- `styles.css`
  - Added media section layout, cards, placeholders, and badge styling.
  - Added avatar styles (grayscale + tint overlay).
  - Updated dark mode variables for subtlety.
  - Adjusted header spacing for new nav.

- `scripts/lastfm.js`
  - Fetches recent tracks from Last.fm.
  - Album art now uses iTunes Search first, then Last.fm fallback.

- `scripts/youtube.js`
  - Fetches video list from `/api/youtube` proxy.
  - Renders duration badges.
  - LocalStorage caching (15 min) with stale fallback.
  - Skips API calls when live reload flag is active.

- `scripts/books.js`
  - Reads Open Library shelves.
  - Uses Google Books proxy for covers (always attempts).
  - Skips API calls when live reload flag is active.

- `scripts/config.js`
  - Stores usernames and IDs only (no API keys).
  - `youtube.channelId` and `books.openLibraryUser` are required.

- `scripts/main.js`
  - Fetches `/api/settings` before triggering API modules.

- `functions/api/youtube.js`
  - Cloudflare Pages Function proxy for YouTube (search + durations).
  - Edge caching via `caches.default`.

- `functions/api/books.js`
  - Cloudflare Pages Function proxy for Google Books.
  - Edge caching via `caches.default`.

- `README.md`
  - Updated setup instructions for proxies and local dev.
  - Added notes about API keys living in Cloudflare env vars.

- `.gitignore`
  - Added `.dev.vars`, `.wrangler/`, `.wrangler-state/`.

## Local Development
- Cloudflare Pages dev (HTML + Functions):
  ```
  npx wrangler pages dev . --ip 127.0.0.1 --port 8788
  ```
  Then open `http://127.0.0.1:8788`.

- `.dev.vars` (not committed):
  ```
  YOUTUBE_API_KEY=...
  GOOGLE_BOOKS_API_KEY=...
  LIVE_DATA_ENABLED=true
  ```

## Cloudflare Pages Env Vars
- `YOUTUBE_API_KEY`
- `GOOGLE_BOOKS_API_KEY`

These should be unrestricted keys (no HTTP referrer restriction) because requests are server-side.

## Known Notes
- YouTube/Google Books quota limits can block responses; proxy will still be functional.
- Work page files were intentionally deleted.
- Wrangler requires Node v20+.
