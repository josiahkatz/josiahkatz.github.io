# Personal Site (Static + Blog)

This is a mostly static HTML/CSS site. Eleventy is used only to generate the blog into `dist/`; the homepage and existing assets are passed through unchanged.

## Files

- `index.html` - Homepage content.
- `styles.css` - Consolidated styles.
- `scripts/config.js` - Usernames and IDs (no API keys stored here).
- `content/blog/posts/` - Markdown blog posts.
- `content/blog/index.njk` - Blog index template.
- `content/blog/tags.njk` - Tag pages generator.
- `content/blog/feed.xml.njk` - RSS feed template.
- `content/_includes/layouts/` - Eleventy layouts.
- `content/_data/site.json` - Site metadata for feeds and OpenGraph.

## Blog URLs

- Blog index: `/blog/`
- Post permalinks: `/blog/YYYY/MM/slug/`
- Tag pages: `/blog/tags/<tag>/`
- RSS feed: `/blog/feed.xml`

## Local Development (with Functions)

Install dependencies once:

```
npm install
```

Start Eleventy in watch mode (rebuilds into `dist/`):

```
npm run dev
```

In another terminal, run Cloudflare Pages dev:

```
npx wrangler pages dev dist --ip 127.0.0.1 --port 8788
```

Then visit `http://127.0.0.1:8788`.

To rebuild once:

```
npm run build
```

To preview without Functions, serve `dist/` directly:

```
python3 -m http.server --directory dist 8080
```

## Cloudflare Pages Build

- Build command: `npm run build`
- Output directory: `dist`
- Functions live in `/functions` (no changes needed)

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

### Strava (via Cloudflare Pages Functions)

1. Create a Strava app: `https://www.strava.com/settings/api`.
2. Add callback domains:
   - `josiahkatz.com`
   - `127.0.0.1` (for local dev)
3. Note your Client ID and Client Secret.
4. Set Cloudflare env vars:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_REFRESH_TOKEN` (see below)
   - `STRAVA_ENABLED` (true/false)

#### Get the Strava refresh token

Temporarily enable the exchange endpoint:
1. Set `STRAVA_EXCHANGE_ENABLED=true` (Cloudflare and `.dev.vars`).
2. Visit this URL (replace CLIENT_ID and REDIRECT):

```
https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=REDIRECT&approval_prompt=force&scope=activity:read
```

Example redirect URL for local dev:

```
http://127.0.0.1:8788/api/strava/exchange
```

3. After authorizing, the endpoint responds with `refresh_token`. Copy it into `STRAVA_REFRESH_TOKEN`.
4. Set `STRAVA_EXCHANGE_ENABLED=false` again.

Use the minimal scope (`activity:read`). Only request `activity:read_all` if you need private activities.

### Cloudflare Pages Functions

This repo includes Pages Functions for the proxy endpoints:
- `/api/youtube` uses `YOUTUBE_API_KEY`
- `/api/books` uses `GOOGLE_BOOKS_API_KEY`
- `/api/strava/recent` uses Strava tokens and returns sanitized activities
- `/api/strava/exchange` exchanges OAuth code for a refresh token (keep disabled)
- `/api/settings` exposes `LIVE_DATA_ENABLED`

These functions keep API keys out of the browser and Git.

## Live Data Toggle

The front-end checks `/api/settings` for a `LIVE_DATA_ENABLED` flag. Set it in Cloudflare (prod) and in `.dev.vars` (local):

```
LIVE_DATA_ENABLED=true
```

Set to `false` to pause all live API calls (Last.fm, YouTube, Open Library, Google Books, Strava).

To disable only Strava, set:

```
STRAVA_ENABLED=false
```

If you want a static preview without Functions, set `liveDataEnabled: false` in `scripts/config.js`, run `npm run build`, and serve `dist/`.

## Deploy

- Cloudflare Pages: set the build command to `npm run build` and output to `dist`.
- Any static host (Netlify, Vercel, S3, etc.): serve the `dist/` directory.
