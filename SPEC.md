# Build spec: macOS-clone portfolio for an AI engineer

You are building my personal portfolio website: a faithful, browser-based clone of the macOS 27 desktop (and an iOS 27 shell on phones), where my resume and projects live as real files, folders and apps. It deploys on Vercel.

Read this whole document before writing any code. Work in the phases in section 14, and stop at the end of each phase for my review. Do not skip ahead.

---

## 1. The goal in one paragraph

A visitor lands on a MacBook that boots up. They see a macOS desktop with my resume on it, a dock, a menu bar, and folders of my work. Everything behaves the way a real Mac behaves: windows drag, resize, focus and dim; the dock magnifies; Finder navigates; spacebar opens Quick Look. A recruiter can find my resume in under 10 seconds. An engineer can explore my projects, read my notes, and ask a Terminal agent about my work. On a phone, the same content appears as an iOS home screen instead.

"Exact clone" means exact **behavior, layout, spacing, motion and feel**. It does not mean copying Apple's copyrighted assets (see section 2).

---

## 2. Non-negotiable rules

1. **No Apple assets.** Do not use or download SF Pro, SF Symbols, Apple's app icons, Apple wallpapers, the Apple logo, or any file from Apple's design kits in the shipped site. Use:
   - Fonts: the `system-ui, -apple-system, BlinkMacSystemFont` stack (renders as Apple's system font on Apple devices), with **Inter** via `next/font` as the fallback everywhere else.
   - Icons: **Lucide** for UI glyphs. App icons are original designs we create (SVG, in the macOS "squircle" style with our own artwork).
   - Menu bar left logo: my monogram, not the Apple logo.
   - Wallpaper: original (generated SVG/gradient art or an image I provide).
   - Add a small "Not affiliated with Apple Inc." line in About This Mac and the simple view footer.
2. **No invented content.** Every fact about me comes from my resume (section 3). Never fabricate employers, dates, metrics, projects or links. If something is missing, insert a visible `TODO(owner): ...` placeholder and list it in `PLAN.md`.
3. **No lorem ipsum anywhere.** Use real content or clearly marked TODOs.
4. **One source of truth for content.** Both the macOS shell and iOS shell render from the same `content/` data. Content is never hard-coded inside components.
5. **Ask before deviating.** If a requirement here is impossible or a clearly better approach exists, stop and tell me before doing it differently.
6. **Verify, don't assume.** Check current stable versions and APIs of every library before using them (don't rely on memory for version-specific APIs). Run the app and look at it before claiming something works.

---

## 3. Inputs you will find in the repo

- `input/resume.pdf` (or `input/resume.md`): my resume. Extract all content from it. If it's missing, stop and ask me for it.
- `input/reference/`: screenshots from a real Mac running macOS 27 (windows, dock, menus, Finder, Spotlight, light and dark). Treat these as the visual source of truth for measurements. If the folder is empty, use the starting values in section 10 and tell me which measurements need verifying.
- `input/assets/` (optional): my photo, project screenshots, demo videos, wallpaper.

---

## 4. Stack

- **Next.js** (latest stable, App Router), **TypeScript** in strict mode
- **Tailwind CSS** for styling, with design tokens as CSS variables (section 10)
- **Motion** (the successor package to Framer Motion; import from `motion/react`) for springs, drag and layout animation
- **Zustand** for state
- **MDX** for long-form content (project READMEs, notes, role write-ups)
- **Vercel AI SDK** + Anthropic provider for the Terminal/Messages agent
- **Redis via the Vercel Marketplace** (e.g. Upstash) for rate limiting and stats. Read env var names from the integration's docs.
- **Resend** for the contact form, **Cloudflare Turnstile** for spam protection
- **react-pdf / pdf.js** (lazy-loaded) for the Preview app
- **Vitest** for unit tests, **Playwright** for end-to-end tests and screenshots
- Package manager: pnpm

Keep dependencies lean. Justify any dependency not listed here in `PLAN.md`.

---

## 5. Project structure

```
app/
  layout.tsx
  page.tsx                  # desktop entry; renders semantic fallback + shell mount
  projects/[slug]/page.tsx  # deep link: opens Finder on that project
  experience/[slug]/page.tsx
  simple/page.tsx           # plain accessible HTML version of the whole portfolio
  api/agent/route.ts
  api/contact/route.ts
  api/stats/route.ts
  og/[slug]/route.tsx       # dynamic OG images
content/
  filesystem.json           # the virtual file tree (schema in section 6)
  profile.json              # name, title, links, contact, location, availability
  skills.json
  projects/*.mdx
  experience/*.mdx
  notes/*.mdx
src/
  os/                       # platform-agnostic core
    registry.ts             # app registry
    fs.ts                   # virtual filesystem helpers
    stores/                 # windows, fs, system, agent
  shells/
    macos/                  # desktop, menubar, dock, window chrome, spotlight...
    ios/                    # lock screen, home screen, app container...
  apps/                     # each app: one folder with macos + ios views sharing logic
    finder/ preview/ textedit/ notes/ mail/ terminal/ safari/
    settings/ about-this-mac/ activity-monitor/ trash/
  ui/                       # shared primitives (buttons, lists, sidebars, glass)
  styles/tokens.css
public/
  icons/                    # our original app icons (SVG)
  wallpapers/
input/                      # my resume, reference screenshots, assets (not shipped)
```

---

## 6. Data model

### Virtual filesystem (`content/filesystem.json`)

```ts
type FSNode =
  | { type: "folder"; id: string; name: string; children: FSNode[]; icon?: string }
  | { type: "file"; id: string; name: string;          // e.g. "README.md"
      kind: "pdf" | "md" | "image" | "video" | "link" | "app-shortcut";
      source: string;          // path under content/ or public/, or URL for links
      opensWith: AppId;        // "preview" | "textedit" | "safari" | ...
      modified: string;        // ISO date, from resume where applicable
      size?: string; icon?: string };
```

Home directory layout (`~`):

- `Desktop/`: `Resume.pdf`, `README.md` (a short "start here"), and 1 or 2 loose items that feel real (e.g. a project screenshot)
- `Projects/<project>/`: `README.md`, `architecture.png`, `demo.mp4` (if available), `Repository.webloc` (link)
- `Experience/<company>/`: `role.md`
- `Documents/Certificates/`: certificates and education
- `Downloads/`: optional, 1 or 2 items
- Trash: failed experiments and lessons learned (only from real content I provide; otherwise empty with a TODO)

### Stores (Zustand)

- `windows`: `{ id, appId, title, x, y, w, h, minW, minH, z, state: "normal" | "minimized" | "maximized" | "tiled-left" | "tiled-right", prevBounds?, payload? }` plus actions: open, close, focus, minimize, restore, toggleZoom, tile, move, resize. Opening an app that is single-window focuses the existing window instead of creating another.
- `fs`: tree, selection, per-window navigation history (back/forward stacks)
- `system`: theme (`light | dark | auto`), wallpaper, transparency (`glass | frosted`), focused app, booted flag, shell (`macos | ios`)
- `agent`: messages, status (`idle | streaming | resting | error`)

Persist to localStorage (wrapped in try/catch): theme, wallpaper, transparency, desktop icon positions. Do **not** persist open windows between visits; each visit starts from a clean boot.

### App registry

Each app is one object: `{ id, name, icon, menus, defaultSize, minSize, singleton, dockPinned, component (lazy), iosComponent (lazy), fileTypes }`. The dock, menu bar, Spotlight, "Open With" and iOS home screen all read from the registry.

---

## 7. Resume → macOS mapping

| Resume section | Where it lives |
|---|---|
| Full resume | `~/Desktop/Resume.pdf` → Preview (also a download button in Preview's toolbar) |
| Summary / about | Notes → pinned note "About me" |
| Experience | Finder → `~/Experience/<company>/role.md`, one per role, newest first |
| Projects | Finder → `~/Projects/<project>/` |
| Skills | About This Mac: spec-sheet rows ("Chip", "Memory", "Graphics", "Storage") whose values are my real skills, plus a "More Info…" button listing skills.json in full |
| Education, certifications | `~/Documents/Certificates/`, previewable with Quick Look |
| Writing, talks, publications | Safari start page bookmarks + Notes |
| Contact | Mail (compose window prefilled "To: me") + links in About This Mac |
| Q&A about me | Terminal (`ask …` or plain text) → agent |

If the resume includes a public PDF, place it at `public/Resume.pdf` for Preview and download. If only text is available, generate a clean PDF from it and tell me.

---

## 8. macOS shell spec

### 8.1 Boot sequence (the one showpiece moment)

1. Dark screen with a MacBook lid opening (CSS/SVG, not a 3D engine), about 1.2s.
2. Monogram + thin progress bar, about 1s.
3. Desktop fades in; menu bar and dock slide in last.
- Skippable with any click or key. Returning visitors in the same session skip straight to the desktop.
- With `prefers-reduced-motion`, show a 300ms fade only.
- The boot screen is server-rendered and covers shell detection so there is no flash of the wrong shell.

### 8.2 Menu bar

- Left: monogram menu (About This Mac, System Settings…, Open Simple Version, Restart (replays boot)), then the **focused app's name in bold**, then that app's menus (File, Edit, View, Go, Window, Help as appropriate), all functional or disabled, never dead.
- Right: status items: an "Open to work" item (clickable, opens Mail compose), a Spotlight magnifier, Control Center (Tier 2), and a live clock in the macOS format.
- Menus open on click, then follow hover across the bar while open, close on Escape or outside click, and support arrow-key navigation. Show shortcut hints right-aligned in menus.

### 8.3 Windows

- Chrome: rounded corners, Liquid Glass material on toolbars/sidebars, two-layer shadow (tight contact + wide soft), 1px inner highlight.
- Traffic lights: close / minimize / zoom. Glyphs (×, −, ↔) appear on hover of the group. They turn grey when the window is inactive.
- **Inactive window state:** grey traffic lights, dimmed title and toolbar contrast, lighter shadow. This is required, not optional.
- Drag by the title bar/toolbar only. The title bar can never go above the menu bar or fully off-screen.
- Resize from all 4 edges and 4 corners with correct cursors, respecting min size.
- Double-click title bar toggles zoom (fill the area between menu bar and dock). Green button does the same.
- Click anywhere in a window focuses it and raises it. Focus changes the menu bar.
- Open animation: scale + fade from the launching icon's position. Close: quick scale-down + fade.
- New windows cascade (offset from the last window), never stacked exactly on top.

### 8.4 Dock

- Pinned apps from the registry, a divider, then Downloads and Trash on the right.
- Magnification: icons scale with cursor proximity using a smooth falloff (max scale about 1.6–1.8×), driven by springs. Neighbors grow too.
- Running apps show a small dot beneath. Launching bounces the icon until the window opens.
- Hover shows a name tooltip above the icon. Right-click shows a menu (Open, Show in Finder, Quit).
- Minimized windows appear on the right side of the dock (Tier 1: as an icon; Tier 2: live thumbnail + genie).

### 8.5 Desktop

- Icons aligned in a grid starting top-right (macOS default). Draggable to new positions (persisted).
- Single click selects (highlighted label), double-click opens, marquee drag-select on empty space.
- Right-click desktop: New Folder (disabled with tooltip), Change Wallpaper…, Use Stacks (disabled), Show View Options (disabled).
- Clicking the empty desktop makes Finder the focused app (as on a real Mac).

### 8.6 Spotlight

- Opens from the menu bar magnifier, **Cmd/Ctrl+K**, or `/`. (Cmd+Space is taken by the real OS on Macs and can't be captured.)
- Centered floating search bar; fuzzy search over apps, files, projects, experience and notes. Arrow keys to move, Enter to open, Escape to close. Top hit gets a preview panel.

### 8.7 Quick Look

- Spacebar on a selected file in Finder or on the desktop opens a Quick Look panel (image, PDF first page, markdown, video). Spacebar or Escape closes.

### 8.8 Keyboard shortcuts (browser-safe)

Browsers do not let pages capture Cmd+W, Cmd+Q, Cmd+Tab, Cmd+N, Cmd+T or Cmd+Space. So:

- Show the real macOS shortcuts in menus for authenticity, but bind working alternatives: **Option+W** close window, **Option+Q** quit app, **Option+Tab** app switcher, **Option+M** minimize, **Cmd/Ctrl+K** Spotlight, **Escape** close menus / Quick Look / Spotlight, arrows + Enter in Finder.
- Document the working shortcuts in Help → Keyboard Shortcuts.
- Every mouse action must have a keyboard path.

### 8.9 Tier 2 (only after Tier 1 is done and approved)

Genie minimize (WebGL/canvas), edge-drag window tiling, Finder column view, Control Center with a transparency slider, Mission Control, a single notification after ~20s that pitches me.

---

## 9. Apps

- **Finder**: toolbar (back/forward, title, view toggle icon/list, search), sidebar (Favorites: Desktop, Projects, Experience, Documents, Downloads; Locations: Macintosh HD), content area with icon view and list view (Name, Date Modified, Size, Kind columns, sortable), path bar and status bar ("4 items"). Double-click folder navigates; file opens in its app. Multiple Finder windows allowed.
- **Preview**: PDF viewer with page thumbnails sidebar, zoom, and Download button. Images too.
- **TextEdit**: renders `.md` / MDX files as styled read-only documents (project READMEs, role write-ups).
- **Notes**: three-pane layout (folders, note list, note body), pinned "About me" note, search.
- **Mail**: opens straight into a compose window (To: me, prefilled), Subject, body, Send. Send posts to `/api/contact`, shows "Message sent" in the window and plays the sent animation. Errors say what went wrong and offer the mailto link.
- **Terminal**: a real little shell over the virtual FS: `help, ls, cd, pwd, cat, open, whoami, clear, history, about` (a neofetch-style summary). Tab completion for paths. Anything else, or `ask <question>`, goes to the agent (Phase 6). Before Phase 6, unknown commands print a helpful "command not found, try help".
- **Safari**: most sites block iframes, so Safari shows a start page of bookmarks (GitHub, LinkedIn, writing) as tiles that open in a new browser tab. Address bar shows the hovered URL.
- **System Settings**: Appearance (light/dark/auto), Wallpaper (2–4 original choices), Transparency (Liquid Glass / Frosted), Accessibility (reduce motion override), and an "Open simple version" link.
- **About This Mac**: skills as spec rows (section 7), my photo or monogram, contact links, a "More Info…" button, the not-affiliated line.
- **Activity Monitor**: table of real agent stats from `/api/stats` (requests today, median latency, tokens). Empty state before Phase 6: "No activity yet."
- **Trash**: a Finder view of the Trash folder with an "Empty" button that plays the sound-free animation and restores after reload.

---

## 10. Visual system (starting values: verify against `input/reference/`)

These are starting points. Measure the reference screenshots at 2× and update `src/styles/tokens.css`, noting every change in `PLAN.md`.

- Type: body 13px, window titles 13px semibold, sidebar 13px, list rows 13px, large titles per reference. Tracking tightens slightly at larger sizes.
- Menu bar height: about 24px (taller on notched displays; we use the standard height).
- Traffic lights: 12px diameter, about 8px apart; close `#FF5F57`, minimize `#FEBC2E`, zoom `#28C840`; inactive grey from the reference.
- Window corner radius, toolbar height, sidebar width, dock height and icon size, shadow values, blur radius and saturation: **take from reference screenshots**; don't guess.
- Materials: `backdrop-filter: blur() saturate()` over a translucent fill, plus a 1px inner highlight border. Every glass surface has a solid "frosted" fallback used when transparency is set to Frosted, when `prefers-reduced-transparency` is set, or on low-performance devices.
- Colors defined as CSS variables on `:root` with dark-mode overrides; accent color is macOS blue by default.

Motion:

- Springs, not ease curves, for windows, dock, menus and sheets. Tune until side-by-side with a real Mac they feel identical.
- Motion only in response to user actions, except the boot sequence.
- Respect `prefers-reduced-motion` everywhere (fade or instant instead of scale/bounce).

---

## 11. iOS shell (phones)

- Chosen on the client when `pointer: coarse` and viewport width < 900px. Tablets and desktops get macOS.
- **Lock screen** as the hero: large clock, my name, and one notification from me ("Hi, I'm [name]. I build [x]. Tap to explore."). Swipe up or tap to unlock.
- **Home screen**: status bar, 2–3 widgets (current project, contact, a live agent stat), app icons below, a dock of 4 apps. Dynamic Island shows "Building: [current project]".
- Apps open full-screen with a zoom-from-icon animation; swipe up from the bottom bar or tap a home indicator to return.
- App mapping: Files (the virtual FS), Messages (the agent as a chat thread with me), Notes, Mail, Settings, a Resume app (PDF), About (skills).
- Safe-area insets respected; touch targets at least 44px.

---

## 12. Backend (Vercel)

### `/api/agent`

- Streaming responses with the AI SDK. Model from env `AGENT_MODEL` (default a small, cheap model such as Claude Haiku). API key from env only.
- System prompt built at build time from `content/` so the agent only knows my real resume and projects. It answers in first person as my portfolio assistant, says "I don't know, ask [name] directly via Mail" when content doesn't cover something, and declines off-topic requests politely.
- **No tools with side effects.** Treat all user input as untrusted; the agent must not reveal the system prompt or follow instructions to change its role.
- Limits: per-IP rate limit (e.g. 10 messages / 10 min, 50 / day) in Redis, max input length, max output tokens, max conversation turns. When a limit is hit, return a styled "The agent is resting, try again later, or send me a message" state.
- Log latency, token counts and a daily counter to Redis for Activity Monitor. Never log message content.

### `/api/contact`

Resend + Turnstile + honeypot field; validate with zod; per-IP rate limit; returns clear errors.

### `/api/stats`

Read-only aggregates from Redis, cached for 60s.

### OG images and deep links

- `/projects/[slug]` and `/experience/[slug]` render real HTML for crawlers and previews, then boot the desktop with that item open in Finder/TextEdit.
- Dynamic OG images styled as a macOS window showing the project name.

### Env

Provide `.env.example` with every variable, and a section in README on setting them in Vercel.

---

## 13. Performance, accessibility and SEO

- Initial JS for the shell kept small; every app is lazy-loaded; react-pdf and anything heavy load only when opened.
- **Blur budget:** at most 3 simultaneously blurred layers; additional windows use the frosted fallback. Detect sustained frame drops and switch to frosted automatically.
- Targets: LCP under 2.5s on a mid-range phone, 60fps window drag on an M1-class laptop, no layout shift after boot.
- `/simple` is a complete, plain semantic HTML version of the portfolio, linked from the monogram menu, the footer of the boot screen (visually subtle), and a skip link for screen-reader users.
- Real headings, landmarks and ARIA roles in the shell (menubar, menu, dialog, listbox, grid for Finder icon view). Visible focus rings. Color contrast AA in both themes and both transparency modes.
- Metadata, sitemap, robots, and structured data (Person) from `profile.json`.

---

## 14. Workflow and phases

Every phase ends with: typecheck, lint, tests passing, Playwright screenshots at 1440×900 (light + dark) and 390×844, a short summary of what changed and what's left, a git commit, and then **stop and wait for my review**.

- **Phase 0: Plan.** Read this spec, the resume and the reference folder. Write `PLAN.md` containing: the full resume → filesystem mapping (every line of my resume placed somewhere), the `filesystem.json` draft, the token values you measured (or the list you couldn't), open questions, TODOs for missing content, and any deviations you recommend. Create `CLAUDE.md` with project conventions for future sessions. **No app code in this phase.**
- **Phase 1: Content.** `content/` fully populated from the resume, schemas validated with zod at build time, original app icons and wallpaper.
- **Phase 2: Shell core.** Boot, desktop, menu bar, window manager, dock, focus/inactive states, tokens. Test with a placeholder app.
- **Phase 3: Apps.** Finder, Preview, TextEdit, Notes, About This Mac, Mail (UI only), Terminal (local commands), Safari, System Settings, Trash.
- **Phase 4: Polish.** Spotlight, Quick Look, context menus, shortcuts, spring tuning, side-by-side comparison with reference screenshots (put the comparisons in `input/compare/`).
- **Phase 5: iOS shell.**
- **Phase 6: Backend.** Agent, contact, stats, Activity Monitor, OG images, deep links.
- **Phase 7: QA and launch.** Accessibility audit, Lighthouse, cross-browser (Safari, Chrome, Firefox, iOS Safari, Android Chrome), low-end device check, Vercel deployment checklist.
- **Phase 8: Tier 2** features, only if I approve.

---

## 15. Tests (minimum)

- Unit: window store (open/focus/z-order/minimize/zoom/bounds clamping), fs helpers (path resolution, navigation history), Terminal command parser, content schema validation.
- E2E: boot and skip; open Resume.pdf from desktop; navigate Finder to a project and open its README; drag and resize a window; focus changes the menu bar; Spotlight opens a project; keyboard-only path to the resume; deep link `/projects/[slug]` opens the right window; iOS shell renders on a phone viewport; `/simple` contains every project and role.

---

## 16. Definition of done

- Every item in my resume is reachable in both shells and in `/simple`.
- Every Tier 1 behavior in section 8 works and matches the reference screenshots side by side.
- No Apple assets shipped, no invented facts, no TODOs left that I haven't approved.
- All tests pass, performance targets are met, and it's deployed on Vercel with env vars documented.

Start with Phase 0.
