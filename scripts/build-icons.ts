// Generates the original app, folder and file icons in public/icons/ and the
// wallpapers in public/wallpapers/. Glyphs come from Lucide (ISC licence);
// the squircles, folders, documents and gradients are our own artwork.
// Run with: node scripts/build-icons.ts (outputs are committed).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = join(import.meta.dirname, '..')
type Node = [string, Record<string, string | number>]

async function glyph(name: string): Promise<Node[]> {
  const file = join(root, 'node_modules/lucide-react/dist/esm/icons', `${name}.mjs`)
  const mod = (await import(pathToFileURL(file).href)) as { __iconData: { node: Node[] } }
  return mod.__iconData.node
}

function nodesToSvg(nodes: Node[]): string {
  return nodes
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      return `<${tag} ${a}/>`
    })
    .join('')
}

// Superellipse-ish squircle inside a 100x100 box with the macOS icon grid
// margin (icon body is ~82% of the canvas).
const SQUIRCLE =
  'M50 9C79.5 9 91 20.5 91 50S79.5 91 50 91 9 79.5 9 50 20.5 9 50 9Z'

async function appIcon(opts: {
  from: string
  to: string
  glyph: string
  color?: string
  stroke?: number
  scale?: number
  extra?: string
}) {
  const g = nodesToSvg(await glyph(opts.glyph))
  const s = opts.scale ?? 1.9
  const offset = 50 - 12 * s
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${opts.from}"/><stop offset="1" stop-color="${opts.to}"/></linearGradient>
<linearGradient id="hl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-opacity=".28"/></filter>
</defs>
<path d="${SQUIRCLE}" fill="url(#bg)"/>
<path d="${SQUIRCLE}" fill="url(#hl)" opacity=".55"/>
<path d="${SQUIRCLE}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/>
${opts.extra ?? ''}
<g transform="translate(${offset} ${offset}) scale(${s})" fill="none" stroke="${opts.color ?? '#fff'}" stroke-width="${opts.stroke ?? 1.6}" stroke-linecap="round" stroke-linejoin="round" filter="url(#sh)">${g}</g>
</svg>
`
}

async function folderIcon(glyphName?: string) {
  const g = glyphName ? nodesToSvg(await glyph(glyphName)) : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5DB4F5"/><stop offset="1" stop-color="#3D97E6"/></linearGradient>
<linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ED0FF"/><stop offset="1" stop-color="#5AB3F4"/></linearGradient>
</defs>
<path d="M10 24a5 5 0 0 1 5-5h20.5a5 5 0 0 1 3.9 1.9l3.2 4.1H85a5 5 0 0 1 5 5V78a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5Z" fill="url(#back)"/>
<path d="M10 36a5 5 0 0 1 5-5h70a5 5 0 0 1 5 5v42a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5Z" fill="url(#front)"/>
<path d="M10.5 36a4.5 4.5 0 0 1 4.5-4.5h70" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>
${g ? `<g transform="translate(35 42) scale(1.25)" fill="none" stroke="#2C7FCC" stroke-opacity=".75" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${g}</g>` : ''}
</svg>
`
}

function docIcon(label: string, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity=".25"/></filter></defs>
<g filter="url(#sh)">
<path d="M22 8h40l18 18v62a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" fill="#fff"/>
<path d="M62 8v14a4 4 0 0 0 4 4h14" fill="#E6E6EA"/>
</g>
<g stroke="#C9C9D0" stroke-width="2.4" stroke-linecap="round"><path d="M30 38h40M30 46h40M30 54h28"/></g>
<rect x="24" y="64" width="52" height="16" rx="3" fill="${color}"/>
<text x="50" y="76" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Inter,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="700" fill="#fff">${label}</text>
</svg>
`
}

function trashIcon(full: boolean) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9DDE3" stop-opacity=".9"/><stop offset=".5" stop-color="#F4F6F8" stop-opacity=".95"/><stop offset="1" stop-color="#C9CED6" stop-opacity=".9"/></linearGradient>
</defs>
${full ? '<path d="M30 20l12-6 8 12M52 12l16 4-4 14M36 16l30 2" fill="#fff" stroke="#9AA3AE" stroke-width="1.2"/>' : ''}
<ellipse cx="50" cy="24" rx="30" ry="6" fill="#B8BFC9"/>
<path d="M20 24l7 62a6 6 0 0 0 6 5h34a6 6 0 0 0 6-5l7-62Z" fill="url(#can)" stroke="#AEB6C1" stroke-width="1"/>
<g stroke="#A5ADB8" stroke-width="1.6" stroke-linecap="round" opacity=".8"><path d="M36 34l3 48M50 34v48M64 34l-3 48"/></g>
<ellipse cx="50" cy="24" rx="30" ry="6" fill="none" stroke="#fff" stroke-opacity=".8"/>
</svg>
`
}

function monogram() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E3A8A"/><stop offset="1" stop-color="#0EA5E9"/></linearGradient></defs>
<rect width="64" height="64" rx="15" fill="url(#g)"/>
<text x="32" y="41" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Inter,Segoe UI,Roboto,sans-serif" font-size="22" font-weight="800" letter-spacing="-1" fill="#fff">MDK</text>
</svg>
`
}

type Stops = [string, string, string, string]
function wallpaper(base: Stops, waves: string[], dark: boolean) {
  const [a, b, c, d] = base
  const paths = waves
    .map((color, i) => {
      const y = 430 + i * 120
      const amp = 90 + i * 25
      return `<path d="M0 ${y} C 480 ${y - amp}, 960 ${y + amp}, 1440 ${y - amp / 2} S 2400 ${y + amp}, 2880 ${y - amp / 3} V1800 H0Z" fill="${color}" opacity="${dark ? 0.55 : 0.6}"/>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 1800" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset=".8" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient>
<radialGradient id="glow" cx=".72" cy=".22" r=".6"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.12 : 0.35}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="30"/></filter>
</defs>
<rect width="2880" height="1800" fill="url(#sky)"/>
<rect width="2880" height="1800" fill="url(#glow)"/>
<g filter="url(#blur)">
${paths}
</g>
</svg>
`
}

async function main() {
  const icons = join(root, 'public/icons')
  const walls = join(root, 'public/wallpapers')
  mkdirSync(icons, { recursive: true })
  mkdirSync(walls, { recursive: true })
  const write = (dir: string, name: string, svg: string) => writeFileSync(join(dir, name), svg)

  const apps: Record<string, Parameters<typeof appIcon>[0]> = {
    finder: { from: '#6CC3FF', to: '#1C6FE0', glyph: 'folder-open' },
    preview: { from: '#F5F7FA', to: '#D6DCE4', glyph: 'scan-eye', color: '#2F6FDB' },
    textedit: { from: '#FFFFFF', to: '#E4E6EA', glyph: 'pen-line', color: '#4A4F58' },
    notes: { from: '#FFE27A', to: '#F7B928', glyph: 'notebook-pen', color: '#6B4E00' },
    mail: { from: '#5AC8FA', to: '#1A73E8', glyph: 'mail' },
    terminal: { from: '#3A3F47', to: '#111317', glyph: 'terminal', color: '#E8EAED', stroke: 2 },
    safari: { from: '#7FD3FF', to: '#1E88E5', glyph: 'compass' },
    settings: { from: '#B5BAC2', to: '#6C727C', glyph: 'settings' },
    about: { from: '#2B3445', to: '#0E1320', glyph: 'cpu', color: '#9CC7FF' },
    'activity-monitor': { from: '#2C3036', to: '#0C0E11', glyph: 'activity', color: '#47E06E', stroke: 2 },
    messages: { from: '#6EE38A', to: '#20B34A', glyph: 'message-circle' },
    files: { from: '#7CC8FF', to: '#1C6FE0', glyph: 'folder' },
    resume: { from: '#FF8A7A', to: '#E0342B', glyph: 'file-user' },
    downloads: { from: '#7CC8FF', to: '#2A7DE1', glyph: 'circle-arrow-down' },
  }
  for (const [name, opts] of Object.entries(apps)) write(icons, `${name}.svg`, await appIcon(opts))

  write(icons, 'trash.svg', trashIcon(false))
  write(icons, 'trash-full.svg', trashIcon(true))
  write(icons, 'monogram.svg', monogram())

  const folders: Record<string, string | undefined> = {
    folder: undefined,
    'folder-desktop': 'monitor',
    'folder-projects': 'code-xml',
    'folder-experience': 'briefcase',
    'folder-documents': 'file-text',
    'folder-downloads': 'arrow-down',
    'folder-applications': 'layout-grid',
    'folder-home': 'house',
    'folder-certificates': 'award',
  }
  for (const [name, g] of Object.entries(folders)) write(icons, `${name}.svg`, await folderIcon(g))

  write(icons, 'doc-pdf.svg', docIcon('PDF', '#E0342B'))
  write(icons, 'doc-md.svg', docIcon('MD', '#5B6270'))
  write(icons, 'doc-image.svg', docIcon('JPG', '#2F9E5B'))
  write(icons, 'doc-video.svg', docIcon('MP4', '#7A4FE0'))
  write(icons, 'doc-link.svg', docIcon('URL', '#1A73E8'))

  write(icons, 'drive.svg', await appIcon({ from: '#E9ECF0', to: '#B9C0CA', glyph: 'hard-drive', color: '#4A4F58' }))

  const wallpapers: Record<string, { light: Stops; dark: Stops; wavesLight: string[]; wavesDark: string[] }> = {
    tide: {
      light: ['#BFE3FF', '#7FB8F0', '#4D7FD8', '#2B4DB0'],
      dark: ['#0B1633', '#12295A', '#1B3C7A', '#0A1330'],
      wavesLight: ['#9ED5FF', '#5E9CF0', '#3C64D0'],
      wavesDark: ['#1C3E7E', '#264F99', '#16336A'],
    },
    dune: {
      light: ['#FFE3C2', '#F7B98A', '#E28A6A', '#B8566A'],
      dark: ['#2A1420', '#4A2032', '#6A2E3C', '#1E0E18'],
      wavesLight: ['#FFD2A1', '#F09A74', '#C9606E'],
      wavesDark: ['#6B2D42', '#86394C', '#4A1E30'],
    },
    grove: {
      light: ['#DDF6E6', '#9EDDB8', '#5DB892', '#2E8A73'],
      dark: ['#0A1F1A', '#103329', '#17493A', '#08171A'],
      wavesLight: ['#BDEBCF', '#79CFA2', '#3FA283'],
      wavesDark: ['#1C5746', '#236A54', '#133D33'],
    },
  }
  for (const [name, w] of Object.entries(wallpapers)) {
    write(walls, `${name}-light.svg`, wallpaper(w.light, w.wavesLight, false))
    write(walls, `${name}-dark.svg`, wallpaper(w.dark, w.wavesDark, true))
  }
  console.log('icons and wallpapers written')
}

await main()
