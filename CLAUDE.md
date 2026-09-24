# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio for Mohith D K: a single-page static site in plain HTML/CSS/JS with a retro pixel-art "save file" theme. There is no build step, no package manager, no framework, and no tests or linter. The only external dependency is Google Fonts, loaded in `index.html`.

## Commands

Local preview (any static server works):

```
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploy by serving the repo root as static files (GitHub Pages from `/ (root)`, or Vercel/Netlify with no build command and output dir `.`).

## Architecture

- `index.html` holds all content. Each section's `id` matches a HUD nav anchor, and each section is dressed as a game element: `#about` (Player Profile), `#experience` (Quest Log), `#projects` (Inventory), `#skills` (Stats), `#education` (Skill Tree), `#achievements` (Trophy Case), `#contact` (Save Point). If you add, remove, or rename a section, update three things together: the `<ul id="hud-links">` nav, the section's `section-index` number, and the `.section` / `.section-alt` alternation.
- Repeating sections (quests, inventory items, stat blocks, tree nodes, trophies) each have one template block, marked with a `<!-- Duplicate this ... -->` comment. Add an entry by copying that block.
- Placeholder content is tagged `[ADD: ...]`. Grep for `[ADD:` to find everything that still needs real content.
- `script.js` is one IIFE written in ES5 style (`var`, no modules). It runs the boot-screen typing sequence, which is hard-capped at about 1.5s and dismissed by any key or click, plus the mobile HUD menu toggle, the HUD clock, and the footer year. It looks elements up by ID, so keep those IDs in sync with `index.html`.
- `styles.css` is split into sections by `/* ==== */` banner comments. All design tokens live in `:root`.

## Design constraints

- The brand palette (`--cream`, `--red`, `--sage`, `--olive`) is marked "do not adjust". `--ink` exists only for text contrast: sage and olive fail WCAG AA as body text on cream, so running text should use `--ink`/`--text`, not sage or olive.
- Keep edges hard (`--radius: 0`) and use thick ink borders with offset shadows (`--border-w`, `--shadow-offset`).
- Four pixel fonts each have one role: `--font-display` (Press Start 2P) for headings, `--font-ui` (Silkscreen) for UI and buttons, `--font-body` (DotGothic16) for body text, and `--font-label` (VT323) for labels.
- Respect `prefers-reduced-motion`. Every animation has a matching `@media (prefers-reduced-motion: reduce)` override, and `script.js` skips the timed boot animation when reduced motion is set. New animations need the same treatment.
- Skill meter fill (`.stat-meter-fill`) is a fixed `width: 70%` in CSS. There is no per-skill level mechanism yet.
- Inline SVG art (such as the hero mini-ship) uses hardcoded palette hex values and `shape-rendering="crispEdges"`.
