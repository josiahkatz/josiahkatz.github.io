# josiahkatz.com

Personal website with live activity data for music, videos, books, and workouts.

## Tech Stack

- **Static HTML/CSS site** with a small asset-hashing build script
- **Cloudflare Pages** for hosting and serverless functions
- **Vanilla JS** for dynamic content (no frameworks)

## Local Development

```bash
npm install
npm run build    # Build the site into dist/
npm run serve    # Dev server at http://127.0.0.1:8788
```

Re-run the build after changing source files.

## Testing

```bash
npm test              # Build + API tests (runs on every push)
npm run test:visual   # Visual regression tests
```

## Contributing

See [CLAUDE.md](./CLAUDE.md) for detailed architecture docs and development patterns.
