# PLAN.md

Implementation record for `SPEC.md`. The owner asked for a one-shot build ("one shot it"), so Phases 0–7 were done in a single pass without the per-phase review stops. Phase 8 (Tier 2) was **not** started, as the spec requires approval first.

## Status

| Phase | State |
|---|---|
| 0 Plan | This file, `CLAUDE.md` |
| 1 Content | `content/` from `input/resume.pdf`, zod validation at build, original icons and wallpapers |
| 2 Shell core | Boot, desktop, menu bar, window manager, dock, focus and inactive states, tokens |
| 3 Apps | Finder, Preview, TextEdit, Notes, About This Mac, Mail, Terminal, Safari, System Settings, Trash, Activity Monitor |
| 4 Polish | Spotlight, Quick Look, context menus, shortcuts, app switcher, springs. **Side-by-side comparisons not done**: `input/reference/` is empty |
| 5 iOS shell | Lock screen, home screen with widgets and Dynamic Island, zoom-from-icon apps |
| 6 Backend | `/api/agent`, `/api/contact`, `/api/stats`, OG images, deep links |
| 7 QA | Unit and e2e suites pass, plus screenshots in `docs/screenshots/`. **Not done:** Lighthouse, a cross-browser pass (only Chromium was tested) and a low-end-device check |
| 8 Tier 2 | Not started (awaiting approval) |

## Resume → portfolio mapping

Every line of `input/resume.pdf` and where it lives. "FS" means a path in `content/filesystem.json`.

| Resume line | Where it lives |
|---|---|
| Name "MOHITH D K" | `profile.json` → menu bar monogram menu, About This Mac, lock screen, `/simple`, JSON-LD, OG images |
| Bangalore, Karnataka | `profile.location` → About This Mac, `/simple`, agent prompt |
| P: 9019325337 | `profile.phone` → `/simple` contact list (also already on the old site) |
| mohithog7@gmail.com | `profile.email` → Mail "To:", About This Mac, Safari favorites, `/simple` |
| linkedin, Github (links) | `profile.links`. URLs taken from the previous site because the PDF shows only the words → Safari favorites, About This Mac, iOS web clips, `/simple` |
| EDUCATION: PES University, B.Tech CSE (AI/ML), Aug 2022 – May 2026, Bangalore | `profile.education` → FS `~/Documents/Certificates/B.Tech — PES University.md`, Notes "About me", Terminal `about`, `/simple` |
| Relevant coursework (8 courses) | `profile.education[0].coursework` → Notes "Coursework", certificate doc, `/simple` |
| A P Moller Maersk — AI Intern, Remote, Jun–Jul 2025, 2 bullets | `content/experience/maersk.mdx` → FS `~/Experience/A.P. Moller Maersk/role.md`, `/experience/maersk` |
| SpectoV — AI Intern, Remote, Jun–Jul 2025, 2 bullets | `content/experience/spectov.mdx` → FS `~/Experience/SpectoV/role.md`, `/experience/spectov` (see open question 1) |
| RAPID Research Lab — Research Intern, on-site, May–Jun 2025, 2 bullets | `content/experience/rapid-research-lab.mdx` → FS `~/Experience/RAPID Research Lab/role.md`, `/experience/rapid-research-lab` |
| Project: Temporal Belief Dynamics in BERT, Jun–Jul 2025, 2 bullets | `content/projects/temporal-belief-dynamics-bert.mdx` → FS `~/Projects/Temporal Belief Dynamics in BERT/README.md` |
| Project: ArsenicCure, Sep 2024 – present, 2 bullets | `content/projects/arseniccure.mdx` → FS `~/Projects/ArsenicCure/README.md`; also the iOS "Currently building" widget and Dynamic Island (`profile.currentProject`) |
| Project: Multimodal Cyberbullying Identification, Oct 2024, 2 bullets | `content/projects/multimodal-cyberbullying-detection.mdx` → FS `~/Projects/Multimodal Cyberbullying Identification/README.md` |
| PUBLICATIONS: M.D.K. et al., ICCIS 2025, BITS Pilani Goa, Springer LNCS | `profile.publications` → Notes "Publication: ICCIS 2025", FS `~/Documents/Certificates/ICCIS 2025 Publication.md`, Safari "Writing", project README, `/simple` |
| TECHNICAL SKILLS (4 categories) | `skills.json` → About This Mac spec rows + "More Info…" (full list), Terminal `about`, `/simple`, agent prompt |
| ACHIEVEMENTS: Winners, HACK-AI 24-hour Data Analytics Hackathon, PES University with Vision Karnataka Foundation | `profile.achievements` → FS `~/Documents/Certificates/HACK-AI Winners.md`, Notes "HACK-AI hackathon win", `/simple` |
| Full resume | `public/Resume.pdf` → FS `~/Desktop/Resume.pdf` (Preview, Download button), `~/Downloads/Mohith_D_K_1.pdf`, iOS "Resume" app, `/simple` download link |

Non-resume content, all from the owner's own previous site: the tagline "Building enterprise AI agents and ML systems…" and the photo (`public/me.jpg`, resized from 3.7 MB to 156 KB).

## Filesystem (`content/filesystem.json`)

```
/ (Macintosh HD)
├── Applications/            Finder.app … Activity Monitor.app (app shortcuts)
└── Users/mohith (~)
    ├── Desktop/             Resume.pdf, README.md ("Start here"), Mohith.jpg
    ├── Projects/<project>/  README.md          (×3)
    ├── Experience/<company>/role.md            (×3, newest first)
    ├── Documents/           Certificates/ (B.Tech, HACK-AI, ICCIS 2025), Keyboard Shortcuts.md
    ├── Downloads/           Mohith_D_K_1.pdf
    └── .Trash/              (empty, see TODOs)
```

The spec's optional `architecture.png`, `demo.mp4` and `Repository.webloc` files are omitted because none exist yet (see TODOs).

## Visual tokens

`input/reference/` is empty, so every value in `src/styles/tokens.css` is a **starting value** from SPEC §10 and macOS 26 conventions. None has been measured. To verify at 2× against real screenshots:

| Token | Current | Verify |
|---|---|---|
| `--menubar-h` | 24px | yes |
| `--titlebar-h` / `--toolbar-h` | 28px / 52px | yes |
| `--window-radius` | 16px | yes |
| `--sidebar-w` | 200px | yes |
| `--traffic-size` / `--traffic-gap` / `--traffic-inset` | 12 / 8 / 20px | yes (colours are from the spec) |
| `--dock-icon` / `--dock-pad` / `--dock-radius` | 52 / 6 / 22px, magnification 1.7× over 150px | yes |
| `--shadow-window` (+ inactive) | contact 2px/6px + wide 22px/60px | yes |
| `--glass-blur` / `--glass-saturate` | 28px / 180% | yes |
| Inactive traffic-light grey | `rgb(0 0 0 / .14)` | yes |
| Springs | windows 420/34, dock 380/28 | tune side by side |

The spec wants side-by-side comparisons in `input/compare/`; that folder is waiting on reference screenshots.

## Open questions for the owner

1. **SpectoV and Maersk are identical on the resume**: same title, dates and both bullets word for word. They are reproduced exactly as written. Please send the real SpectoV bullets, or confirm both are correct.
2. **Title.** The resume says "AI Intern" (Jun–Jul 2025), but the old site said "AI Engineer Intern @ A.P. Moller Maersk". The site now uses "AI Intern". Is the Maersk role ongoing, and under which title?
3. **"Open to work"**: the spec requires this status item. It is on (`profile.availability.open`); set it to `false` if that is wrong.
4. **Project repositories**: are ArsenicCure and the cyberbullying project public? If so, add their URLs.

## TODOs (missing content)

- `TODO(owner)`: link to the ICCIS 2025 paper (DOI or Springer page). Shown in Notes and Safari → `profile.publications[0].url`.
- `TODO(owner)`: repository and demo links for each project → `repo` / `demo` in `content/projects/index.json`. `Repository.webloc` files will be added once they exist.
- `TODO(owner)`: architecture diagrams, screenshots or demo videos for projects → `public/` and `filesystem.json`.
- `TODO(owner)`: Trash content (failed experiments and lessons learned). The Trash currently shows an empty state with this TODO.
- `TODO(owner)`: HACK-AI date and winning project (Notes).
- Reference screenshots of real macOS for `input/reference/`.

## Deviations and decisions

- **No per-phase stops**: at the owner's request.
- **TypeScript 6, not 7**: typescript-eslint doesn't support TS 7.0 yet (errors on load). TS 6 is used for both `tsc` and lint.
- **ESLint 10 + eslint-plugin-react**: the plugin's React-version auto-detection crashes on ESLint 10, so the version is pinned in `eslint.config.mjs`. `@next/next/no-img-element` is off because every `<img>` is a small static SVG or the photo.
- **pdf.js 6 compatibility**: pdf.js 6 calls `Map.prototype.getOrInsertComputed` (the TC39 upsert proposal), which Safari and older Chromium lack. Added `src/apps/preview/polyfills.ts` and the legacy worker build. Without these, Preview crashes in those browsers.
- **Brand glyphs**: current Lucide has no GitHub or LinkedIn icons. About This Mac uses generic glyphs; the iOS web clips use "GH" and "in" text.
- **Content metadata**: MDX bodies carry no frontmatter. Metadata lives in an `index.json` next to each collection, so zod can validate it without a YAML parser.
- **Toolbars are solid, sidebars are glass**: this keeps within the blur budget (menu bar + dock + the focused window's sidebar = 3 blurred layers). Inactive windows' sidebars switch to the frosted fill. Transient menus, Spotlight and Quick Look add one blurred layer while open. A frame-rate watchdog switches to Frosted after 3 slow seconds.
- **Agent default model**: `claude-haiku-4-5` (overridable with `AGENT_MODEL`). The agent streams plain text; the client is a small fetch reader, not `@ai-sdk/react`, which keeps the Terminal free of chat-UI dependencies.
- **Control Center** (Tier 2 in the spec) is not in the menu bar.

### Dependencies beyond SPEC §4

| Package | Why |
|---|---|
| `remark-gfm` | Markdown tables (Keyboard Shortcuts doc) |
| `server-only` | Keeps Redis, stats and prompt code out of client bundles |
| `@upstash/redis`, `@upstash/ratelimit` | The Redis client and sliding-window limits for the Vercel Marketplace Upstash integration |
| `lucide-react` | UI glyphs (named in the spec) |
| `@tailwindcss/postcss`, `eslint-config-next`, `@types/*` | Standard toolchain |

## Tier 2 backlog (needs approval)

Genie minimize, edge-drag tiling (menu-driven tiling already exists), Finder column view, Control Center with a transparency slider, Mission Control, and the 20-second pitch notification.
