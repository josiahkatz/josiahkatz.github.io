# Personal Site (Static)

This is a flat HTML/CSS site with no build tools or dependencies.

## Files

- `index.html` — Homepage content.
- `styles.css` — Consolidated styles.
- `scripts/config.js` — Usernames and IDs

## Local Preview

For live reload on code changes, run:

```
node ./scripts/dev-server.mjs
```

Then visit `http://localhost:8080`. To use a different port:

```
PORT=8090 node ./scripts/dev-server.mjs
```

If you prefer a simple static server without live reload, you can run:

```
python3 -m http.server 8080
```

## API Setup

Edit `scripts/config.js` to configure the feeds.

### Last.fm

1. Create an API key: `https://www.last.fm/api/account/create`
2. Set `lastfm.apiKey` and `lastfm.user`.

### YouTube (via Cloudflare Pages Functions)

1. Create a project in Google Cloud Console.
2. Enable "YouTube Data API v3".
3. Create an API key.
4. Leave application restrictions set to "None" (server-side calls from Cloudflare won't send a referrer).
5. In Cloudflare Pages, set environment variable `YOUTUBE_API_KEY`.
6. Set `youtube.channelId` in `scripts/config.js`.

### Books (Open Library + Google Books covers)

1. Open Library: set `books.openLibraryUser` (your Open Library username).
2. Google Books: enable "Books API" in Google Cloud and create an API key.
3. Leave application restrictions set to "None" (server-side calls from Cloudflare won't send a referrer).
4. In Cloudflare Pages, set environment variable `GOOGLE_BOOKS_API_KEY`.

### Cloudflare Pages Functions

This repo includes Pages Functions for the proxy endpoints:
- `/api/youtube` uses `YOUTUBE_API_KEY`
- `/api/books` uses `GOOGLE_BOOKS_API_KEY`

These functions keep API keys out of the browser and Git.

## Live Reload + API Calls

When the live-reload dev server is running, API calls are paused to avoid quota usage. The UI will show a "Live reload active" status.

To fetch live data again:
- Stop the dev server, or
- Open the site on a non-localhost domain, or
- Clear `localStorage` key `livereload-active`.

## Local API Testing (Optional)

If you want to test the proxy endpoints locally, run Cloudflare Pages dev:

```
npx wrangler pages dev .
```

Create a local `.dev.vars` file (do not commit) with:

```
YOUTUBE_API_KEY=your_key
GOOGLE_BOOKS_API_KEY=your_key
```

## Deploy

- GitHub Pages: Push to `main` on a `username.github.io` repo, or enable Pages for this repo.
- Any static host (Netlify, Vercel, S3, etc.): Serve the repo root.
