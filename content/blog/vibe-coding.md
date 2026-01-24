---
title: Vibe Coding and Building in Public
date: 2026-01-24
summary: How AI-assisted coding brought back the joy of shipping side projects, and what I built in a few weeks with Claude and Codex.
tags: [AI, web design, development]
---

I've been coding again. Like, *actually* coding—not just managing developers or reviewing pull requests, but sitting down and building things myself. And it's been incredibly fun.

Simon Willison recently wrote about [coding again](https://simonwillison.net/2026/Jan/4/coding-again/) after years of being too busy with other things. His key insight resonated: "AI assistance means you can get something useful done in half an hour, or even while you are doing other stuff." This is exactly what I've experienced.

I'm calling it "vibe coding"—that flow state where you describe what you want, collaborate with an AI coding assistant, and ship features in the time it used to take just to set up your development environment. It's not about replacing programming knowledge; it's about removing the friction that kept me from *using* that knowledge.

## What I Built

In the past three weeks, I've transformed my personal site from a static "under construction" page into a dynamic dashboard of my digital life. Here's what's live:

**Live API Integrations:**
- **Last.fm** - Recently played music with album art
- **YouTube** - Latest videos from my channel
- **Google Books** - Currently reading with cover images
- **Strava** - Recent workouts (with privacy-first data sanitization)

**Developer Experience Improvements:**
- **Claude Code hooks** - Auto-builds and serves the site when I start a coding session, gracefully stops the server when I'm done
- **CLAUDE.md** - A comprehensive guide that teaches Claude Code about my codebase architecture, build commands, and coding patterns
- **Test suite** - Build verification, API validation, and visual regression tests with Playwright

**Performance Optimizations:**
- **Lazy loading** with Intersection Observer - Sections only fetch data when scrolled into view (75% reduction in initial API calls)
- **Stale-while-revalidate caching** - Cloudflare Functions serve cached content instantly while fetching fresh data in the background
- **Exponential backoff retry logic** - Graceful handling of API failures

**UX Polish:**
- Carousel navigation with arrow controls
- Skeleton loaders that match final content dimensions
- Mobile-optimized horizontal scrolling with snap points
- Unified card component system for all media types

## The Vibe Coding Workflow

Here's what my typical coding session looks like now:

1. **Open Claude Code** - My custom hooks automatically run `npm run build` and `npm run serve`
2. **Describe what I want** - "Add carousel navigation to the media sections" or "Improve the skeleton loaders"
3. **Collaborate on implementation** - Claude reads the codebase, suggests an approach, I provide feedback, we iterate
4. **Ship it** - Tests run automatically on push, Cloudflare Pages deploys immediately

The CLAUDE.md file has been transformative. It's a 300+ line guide that documents everything from build commands to architectural decisions to UX patterns. Claude Code reads it at the start of each session and *understands* my codebase. It knows that I use vanilla JavaScript modules (no bundler), that Eleventy only processes the blog, that API keys live in Cloudflare environment variables.

This is what Willison meant by "management-adjacent skills." I'm not writing every line of code myself—I'm providing clear requirements, architectural guidance, and feedback. It's like having a very fast junior developer who never gets tired and always remembers the exact syntax for CSS Grid properties.

## The Joy of Iteration

One of my favorite things about this workflow is how easy it is to *change my mind*.

I spent a day adding Decap CMS so I could write blog posts from my phone. Got it working, used it once, realized I didn't actually need it. A week later: "Claude, remove the CMS and notes system. Simplify the blog to just markdown files." Done in 20 minutes.

Tried different layouts for the Strava workout cards. Experimented with card aspect ratios. Tweaked the skeleton loader animations. Added a design preview page to mockup blog post styles, then removed it from production once I'd decided on the design.

The low friction of making changes means I can actually *experiment*. I'm not locked into architectural decisions because they took two days to implement. If something doesn't feel right, I can try something else.

## What I'm Learning

A few observations after three weeks of intensive vibe coding:

**AI assistants are opinionated** - Claude will often suggest adding error handling, TypeScript, or abstractions I don't need yet. I've learned to be specific: "Keep this simple. No extra error handling. Just solve the immediate problem."

**Reading code is still essential** - I always read files before making changes. The AI needs to understand the existing patterns to maintain consistency. "Show me how the YouTube integration works" before "Now add the same pattern for Strava."

**Documentation for AI is documentation for humans** - CLAUDE.md started as instructions for Claude Code, but it's turned into the best documentation I've ever written. It's comprehensive because it *has* to be—the AI can't guess my architectural decisions.

**Shipping is addictive** - When you can implement a feature in 30 minutes instead of 3 hours, you ship more. When you ship more, you learn faster. When you learn faster, you build better things.

## What's Next

Here are the next experiments I'm excited about (and yes, this is also a convenient list to test ordered lists):

1. Add webmentions for blog posts (replies from social media)
2. RSS feed with full post content
3. Add a "now" page with manual updates on what I'm focused on
4. Experiment with view transitions API for smoother navigation
5. Maybe add comments? (Still torn on this one)

The point isn't to plan everything out—it's to stay in the flow of building and shipping. To keep the momentum going. To remember why I fell in love with making things for the web in the first place.

If you haven't tried coding with AI assistance yet, I'd encourage you to experiment. Not because it's magic or will replace developers, but because it might help you actually *finish* that side project you've been thinking about for years.

The web is fun again. Let's build things.
