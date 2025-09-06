# Personal Site (Static)

This is a flat HTML/CSS site with no build tools or dependencies.

## Files

- `index.html` — Homepage content.
- `styles.css` — Consolidated styles.

## Local Preview

Open `index.html` directly in your browser, or run a simple static server:

```
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy

- GitHub Pages: Push to `main` on a `username.github.io` repo, or enable Pages for this repo.
- Any static host (Netlify, Vercel, S3, etc.): Serve the repo root.
