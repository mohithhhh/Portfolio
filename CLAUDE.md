# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Mohith D K's portfolio: a browser recreation of a macOS desktop (and an iOS home screen on phones) where the resume lives as files, folders and apps. Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + Motion + Zustand + MDX, deployed on Vercel. `SPEC.md` is the product spec; `PLAN.md` records how it was implemented, open questions, TODOs and deviations.

## Commands

```
pnpm dev                 # runs `pnpm content` first, then next dev
pnpm build && pnpm start # production build (also runs `pnpm content`)
pnpm lint                # eslint (flat config)
pnpm typecheck           # content build + tsc --noEmit
pnpm test                # content build + vitest (tests/unit)
pnpm vitest run tests/unit/fs.test.ts -t "resolves"   # one unit test
pnpm test:e2e            # Playwright; starts `pnpm start` on :3300 with AGENT_MOCK=1, so run `pnpm build` first
pnpm test:e2e -g "Spotlight"                          # one e2e test
SCREENSHOTS=1 pnpm test:e2e screenshots --project desktop   # regenerate docs/screenshots
node scripts/build-icons.ts   # regenerate public/icons + public/wallpapers (committed outputs)
```

If Playwright's own Chromium isn't installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a local Chromium binary.

## Architecture

- **Content is the single source of truth.** Everything about Mohith lives in `content/` (`profile.json`, `skills.json`, `filesystem.json`, and `projects|experience|notes/` each with an `index.json` for metadata plus one `.mdx` per item, `docs/*.mdx` for loose documents). Components never hard-code facts. `scripts/build-content.ts` validates all of it with the zod schemas in `src/content/schema.ts`, checks every filesystem `source` exists, and writes `src/generated/documents.json` (raw markdown for Spotlight, Terminal `cat`, the agent prompt). `src/content/index.ts` re-validates and exports typed data. Never invent content: missing facts become visible `TODO(owner): …` text and a line in `PLAN.md`.
- **Virtual filesystem.** `content/filesystem.json` is the tree (root → Applications, Users/mohith = home). `src/os/fs.ts` holds pure helpers (paths, resolution, sorting, tab completion, back/forward history); `src/os/vfs.ts` is the indexed instance. File nodes carry `kind` and `opensWith`; `src/os/actions.ts` (`openNode`, `openApp`, `activateApp`) is the one place that decides which app opens what.
- **Apps.** `src/os/apps-meta.ts` is pure metadata (sizes, singleton, dock pinning, iOS name). `src/os/registry.tsx` adds lazy components (`component` for macOS, `iosComponent` for iOS) and window chrome (`toolbar`: the app draws its own draggable `<Toolbar>`; `titlebar`: the window draws one). Each app is a folder in `src/apps/`, with macOS and iOS views sharing hooks (e.g. `useFinder`, `useNotes`, `useCompose`).
- **State (Zustand, `src/os/stores/`).** `windows` (window manager: open/focus/z-order/minimize/zoom/tile/clamping, `activeApp` for the menu bar), `fs` (selection per surface, Finder history per window), `system` (theme, wallpaper, transparency, motion, icon positions; persisted via `safeStorage`, open windows never persisted), `ui` (Spotlight, Quick Look, context menu, switcher, sheet), `agent` (chat + streaming). Apps react to menu commands through the window `payload` (e.g. Finder `view`, Preview `zoom`), so menus in `src/os/menus.ts` stay data-only.
- **Shells.** `app/layout.tsx` has an inline script that runs before paint: picks `data-shell` (ios when `pointer: coarse` and width < 900), applies persisted theme/transparency/motion, and marks returning visitors `data-booted`. The server-rendered `BootScreen` (pure CSS animation) covers that; `ShellLoader` dynamically imports only `macos/MacShell` or `ios/IOSShell`. `SemanticSummary`/`DeepLinkPage` render real HTML that is visible without JS and screen-reader-only once the shell runs.
- **Windows.** `src/shells/macos/Window.tsx` drags/resizes by writing styles directly during the gesture and commits clamped bounds to the store on pointer-up (then re-syncs the DOM). Only elements under `[data-drag-region]` drag; interactive elements and `[data-no-drag]` never do. Geometry constants in `src/os/geometry.ts` must match `src/styles/tokens.css`.
- **Backend.** `app/api/agent` (AI SDK `streamText` → plain text stream; system prompt built from content in `src/server/agent-prompt.ts`; no tools), `app/api/contact` (zod + honeypot + Turnstile + Resend), `app/api/stats` (60s cache). Redis (`src/server/redis.ts`) is optional: without it rate limits fall back to in-memory and stats report unavailable. `AGENT_MOCK=1` streams a canned reply (tests only). Env vars are listed in `.env.example`.
- **Routes.** `/simple` (complete plain HTML version), `/projects/[slug]` and `/experience/[slug]` (static HTML, then the desktop boots with the item open), `/og/[slug]` (OG images), `sitemap.ts`, `robots.ts`.

## Conventions and gotchas

- No Apple assets: system font stack with Inter fallback, Lucide glyphs, original icons/wallpapers from `scripts/build-icons.ts`, `MDK` monogram instead of the Apple logo. Keep the "Not affiliated with Apple Inc." lines.
- Browser-safe shortcuts: menus show real ⌘ shortcuts, but working bindings are ⌥W/⌥Q/⌥M/⌥Tab, ⌘K//, Space, Esc (`src/shells/macos/Shortcuts.tsx`). Document new ones in `content/docs/keyboard-shortcuts.mdx`.
- Every animation needs a reduced-motion path (`useReducedMotion()` or the CSS overrides keyed on `prefers-reduced-motion` / `html[data-motion=reduce]`). Every glass surface needs the frosted fallback (`.glass`, `html[data-transparency=frosted]`, `prefers-reduced-transparency`).
- Tailwind v4 preflight strips heading weights and list bullets; `src/styles/base.css` and `prose.css` restore them.
- pdf.js 6 needs `src/apps/preview/polyfills.ts` (Map/WeakMap `getOrInsert*`) and uses the legacy worker build. Keep both until target browsers ship the upsert proposal.
- TypeScript is pinned to 6.x because typescript-eslint doesn't support TS 7 yet; `eslint.config.mjs` pins the React version because eslint-plugin-react's detection breaks on ESLint 10.
- The React Compiler lint rules from eslint-config-next are on: no setState in effects, no ref reads during render, no components created during render.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
