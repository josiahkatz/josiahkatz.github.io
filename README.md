# josiahkatz.com

Personal website with a blog and live data feeds (music, videos, books, workouts).

## Tech Stack

- **Static site** with Eleventy for blog generation
- **Cloudflare Pages** for hosting and serverless functions
- **Vanilla JS** for dynamic content (no frameworks)

## Local Development

```bash
npm install
npm run dev      # Watch mode (rebuilds on changes)
npm run serve    # Dev server at http://127.0.0.1:8788
```

Run both commands in separate terminals for the full dev experience.

## Writing Blog Posts

Create a markdown file in `content/blog/`:

```markdown
---
title: Your Post Title
date: 2026-01-24
summary: A brief description
tags: [design, topic]
---

Your content here...
```

Then build and deploy: `npm run build`

## Testing

```bash
npm test              # Build + API tests (runs on every push)
npm run test:visual   # Visual regression tests
```

## Contributing

See [CLAUDE.md](./CLAUDE.md) for detailed architecture docs and development patterns.
