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

Source: `input/resume.pdf` (the October 2026 resume; it replaced the September one). Every line and where it lives. "FS" means a path in `content/filesystem.json`.

| Resume line | Where it lives |
|---|---|
| Name, Bangalore, phone, email | `profile.json` → menu bar, About This Mac, lock screen, Mail "To:", `/simple`, JSON-LD, OG images |
| linkedin, Github | `profile.links` (URLs from the PDF's link annotations) → Safari favorites, About This Mac, iOS web clips, `/simple` |
| EDUCATION: PES University, B.Tech CSE (AI/ML), CGPA 8.16, Aug 2022 – May 2026 | `profile.education` (incl. `cgpa`) → FS `~/Documents/Certificates/B.Tech — PES University.md`, Notes "About me", Terminal `about`, `/simple` |
| Relevant coursework (8 courses) | `profile.education[0].coursework` → Notes "Coursework", certificate doc, `/simple` |
| A P Moller Maersk — AI/ML Engineering Intern, On-site, Jan 2026 – present, 4 bullets | `content/experience/maersk.mdx` → FS `~/Experience/A.P. Moller Maersk/role.md`, `/experience/maersk`; `profile.title` |
| SpectoV — AI Intern, Remote, Jun – Jul 2025, 2 bullets | `content/experience/spectov.mdx` → FS `~/Experience/SpectoV/role.md`, `/experience/spectov` |
| RAPID Research Lab — Research Intern, on-site, May – Jun 2025, 2 bullets | `content/experience/rapid-research-lab.mdx` → FS `~/Experience/RAPID Research Lab/role.md` |
| Project: Il Colosseo (Aug 2026, ilcolosseo.vercel.app), 2 bullets | `content/projects/il-colosseo.mdx` → FS `~/Projects/Il Colosseo/` (README.md, Live Site.webloc), Safari, `/projects/il-colosseo` |
| Project: Provenance (Oct 2026, provenance.mohithog7.workers.dev), 2 bullets | `content/projects/provenance.mdx` → FS `~/Projects/Provenance/`; `profile.currentProject` (iOS widget, Dynamic Island) |
| Project: DawaiSathi (Jul 2026, dawaisathi.vercel.app), 2 bullets | `content/projects/dawaisathi.mdx` → FS `~/Projects/DawaiSathi/` |
| Project: Temporal Belief Dynamics in BERT, Jun – Jul 2025, 2 bullets | `content/projects/temporal-belief-dynamics-bert.mdx` → FS `~/Projects/Temporal Belief Dynamics in BERT/README.md` |
| OPEN SOURCE: pydantic-ai (21k★) PR #10805, Oct 2026 | `content/opensource/pydantic-ai.mdx` + `index.json` → FS `~/Open Source/pydantic-ai/` (README.md, Pull Request.webloc), Safari, Terminal `opensource`, `/simple` |
| OPEN SOURCE: REA (358k★) PR #6137, Oct 2026 | `content/opensource/rea.mdx` → FS `~/Open Source/REA/` |
| PUBLICATIONS: ICCIS 2025, Springer LNCS | `profile.publications` → Notes, Certificates doc, Safari "Writing", project README, `/simple` |
| TECHNICAL SKILLS (4 categories) | `skills.json` → About This Mac spec rows + "More Info…", Terminal `about`, `/simple`, agent prompt |
| ACHIEVEMENTS: HACK-AI winners | `profile.achievements` → FS `~/Documents/Certificates/HACK-AI Winners.md`, Notes, `/simple` |
| Full resume | `public/Resume.pdf` → FS `~/Desktop/Resume.pdf`, `~/Downloads/Mohith_resume_AI.pdf`, iOS "Resume", `/simple` download |

Removed with the new resume: ArsenicCure and the multimodal cyberbullying project (no longer listed), and the Jun–Jul 2025 Maersk internship entry (the resume now lists the Jan 2026 role).

Non-resume content, both from the owner's previous site: the tagline "Building enterprise AI agents and ML systems…" and the photo.

## Filesystem (`content/filesystem.json`)

```
/ (Macintosh HD)
├── Applications/            Finder.app … Activity Monitor.app (app shortcuts)
└── Users/mohith (~)
    ├── Desktop/             Resume.pdf, README.md ("Start here"), Mohith.jpg
    ├── Projects/<project>/  README.md, Live Site.webloc   (×4; the research project has no live site)
    ├── Experience/<company>/role.md            (×3, newest first)
    ├── Open Source/<repo>/  README.md, Pull Request.webloc (×2)
    ├── Documents/           Certificates/ (B.Tech, HACK-AI, ICCIS 2025), Keyboard Shortcuts.md
    ├── Downloads/           Mohith_resume_AI.pdf
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

1. **"Open to work"**: the spec requires this status item. It is on (`profile.availability.open`); set it to `false` if that is wrong.
2. **Current project**: the iOS Dynamic Island and widget say "Building: Provenance" (the most recent project). Change `profile.currentProject` if another one is current.
3. **Repositories**: add public repo URLs for Il Colosseo, Provenance and DawaiSathi (`repo` in `content/projects/index.json`) to get a Repository link next to each Live Site.

Resolved by the October 2026 resume: the duplicated SpectoV/Maersk bullets and the job title.

## TODOs (missing content)

- `TODO(owner)`: link to the ICCIS 2025 paper (DOI or Springer page). Shown in Notes and Safari → `profile.publications[0].url`.
- `TODO(owner)`: repository links for each project → `repo` in `content/projects/index.json` (live links are in).
- `TODO(owner)`: architecture diagrams, screenshots or demo videos for projects → `public/` and `filesystem.json`.
- `TODO(owner)`: Trash content (failed experiments and lessons learned). The Trash currently shows an empty state with this TODO.
- `TODO(owner)`: HACK-AI date and winning project (Notes).
- Reference screenshots of real macOS for `input/reference/`.

## Deviations and decisions

- **No per-phase stops**: at the owner's request.
- **TypeScript 6, not 7**: typescript-eslint doesn't support TS 7.0 yet (errors on load). TS 6 is used for both `tsc` and lint.
- **ESLint 10 + eslint-plugin-react**: the plugin's React-version auto-detection crashes on ESLint 10, so the version is pinned in `eslint.config.mjs`. `@next/next/no-img-element` is off because every `<img>` is a small static SVG or the photo.
- **pdf.js 6 compatibility**: pdf.js 6 calls `Map.prototype.getOrInsertComputed` (the TC39 upsert proposal), which Safari and older Chromium lack. Added `src/apps/preview/polyfills.ts` and the legacy worker build. Without these, Preview crashes in those browsers.
- **Brand marks**: GitHub and LinkedIn use their official marks (paths from Simple Icons, `src/ui/brandPaths.ts`), only as links to Mohith's profiles, as both brands' guidelines allow.
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

Genie minimize, edge-drag tiling (menu-driven tiling already exists), Finder column view, Control Center with a transparency slider and Mission Control. (The 20-second intro notification is now built: `src/shells/macos/Notification.tsx`.)
