# Mohith D K — Portfolio

AI Engineer @ A.P. Moller Maersk.

A single-page, no-build portfolio site with a retro pixel-art / save-file
theme: boot sequence, HUD nav, Quest Log (experience), Inventory (projects),
Stats (skills), Skill Tree (education), Trophy Case (achievements), and a
Save Point (contact).

Plain HTML/CSS/JS — no build step, no dependencies beyond Google Fonts.

## Files

- `index.html` — all page content/structure
- `styles.css` — design tokens, layout, retro styling
- `script.js` — boot sequence, mobile menu, HUD clock
- `assets/favicon.svg` — pixel favicon

## Filling in your content

Search the codebase for `[ADD:` — every placeholder is tagged with what's
needed (tagline, bio, experience dates/impact lines, projects, skills,
education, achievements, LinkedIn URL). Sections that repeat (experience,
projects, skills, education, achievements) have one example block each —
duplicate the block for additional entries.

## Deploy

No build step required — deploy the repo root as static files.

**GitHub Pages**
1. Repo → Settings → Pages → Source: `Deploy from a branch` → branch `main` (or your default), folder `/ (root)`.
2. Push to that branch; the site publishes at `https://<user>.github.io/<repo>/`.

**Vercel**
1. Import the repo in Vercel.
2. Framework preset: `Other`. No build command, output directory: `.` (root).

**Netlify**
1. Import the repo.
2. Build command: (leave empty). Publish directory: `.` (root).

## Local preview

Any static server works, e.g.:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
