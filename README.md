# Personal Site (Static)

This is a flat HTML/CSS site with no build tools or dependencies.

## Files

- `index.html` — Homepage content.
- `styles.css` — Consolidated styles.
- `scripts/config.js` — API keys and usernames.

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

### YouTube

1. Create a project in Google Cloud Console.
2. Enable "YouTube Data API v3".
3. Create an API key and restrict HTTP referrers:
   - `http://localhost:*`
   - `http://127.0.0.1:*`
   - `https://josiahkatz.com/*`
   - `https://www.josiahkatz.com/*`
4. Set `youtube.apiKey` and `youtube.channelId`.

### Books (Open Library + Google Books covers)

1. Open Library: set `books.openLibraryUser` (your Open Library username).
2. Google Books: enable "Books API" in Google Cloud, create an API key, and add the same HTTP referrers as YouTube.
3. Set `books.googleBooksApiKey`.

## Live Reload + API Calls

When the live-reload dev server is running, API calls are paused to avoid quota usage. The UI will show a "Live reload active" status.

To fetch live data again:
- Stop the dev server, or
- Open the site on a non-localhost domain, or
- Clear `localStorage` key `livereload-active`.

## Deploy

- GitHub Pages: Push to `main` on a `username.github.io` repo, or enable Pages for this repo.
- Any static host (Netlify, Vercel, S3, etc.): Serve the repo root.
