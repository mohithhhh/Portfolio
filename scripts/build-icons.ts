// Generates the original app, folder and file icons in public/icons/, the
// brand marks in public/brands/ and the wallpapers in public/wallpapers/.
// App artwork lives in ./app-icons.ts; folder glyphs come from Lucide (ISC).
// No Apple artwork is used. Run with: node scripts/build-icons.ts (outputs are committed).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { APP_ICONS } from './app-icons.ts'
import { GITHUB_PATH, LINKEDIN_PATH } from '../src/ui/brandPaths.ts'

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

async function folderIcon(glyphName?: string) {
  const g = glyphName ? nodesToSvg(await glyph(glyphName)) : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FA6F0"/><stop offset="1" stop-color="#2C7FD9"/></linearGradient>
<linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ED8FF"/><stop offset=".55" stop-color="#6DBDF7"/><stop offset="1" stop-color="#4AA3EE"/></linearGradient>
<linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4EEF8"/></linearGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.4" flood-color="#0B3A75" flood-opacity=".35"/></filter>
<filter id="in" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="-.6" stdDeviation=".3" flood-color="#0B4A95" flood-opacity=".35"/></filter>
</defs>
<g filter="url(#sh)">
<path d="M10 25a5 5 0 0 1 5-5h20.5a5 5 0 0 1 3.9 1.9l3.2 4.1H85a5 5 0 0 1 5 5V77a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5Z" fill="url(#back)"/>
<rect x="15" y="29" width="70" height="20" rx="2" fill="url(#paper)"/>
<path d="M10 37a5 5 0 0 1 5-5h70a5 5 0 0 1 5 5v40a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5Z" fill="url(#front)"/>
</g>
<path d="M10.5 37a4.5 4.5 0 0 1 4.5-4.5h70a4.5 4.5 0 0 1 4.5 4.5" fill="none" stroke="url(#lip)" stroke-width="1"/>
<path d="M10 72v5a5 5 0 0 0 5 5h70a5 5 0 0 0 5-5v-5" fill="#1F6FC9" opacity=".12"/>
${g ? `<g transform="translate(35 43) scale(1.25)" fill="none" stroke="#2A78C8" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" filter="url(#in)">${g}</g>` : ''}
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
  const mesh: string[] = []
  for (let x = 24; x <= 76; x += 4) mesh.push(`M${x} 26L${50 + (x - 50) * 0.78} 90`)
  for (let y = 32; y <= 86; y += 4.5) {
    const k = (y - 26) / 64
    const half = 30 - 7 * k
    mesh.push(`M${(50 - half).toFixed(1)} ${y}H${(50 + half).toFixed(1)}`)
  }
  const papers = full
    ? `<g filter="url(#ps)"><path d="M30 26c2-9 10-13 16-10l-3 12Z" fill="#fff"/><path d="M44 24c3-10 14-12 19-6l-6 10Z" fill="#F4F4F2"/><path d="M58 26c4-8 12-8 15-3l-8 6Z" fill="#fff"/><path d="M38 18l8 2-2 8-8-2Z" fill="#E9E6DC"/></g>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<linearGradient id="can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CFD7" stop-opacity=".78"/><stop offset=".35" stop-color="#F7F9FB" stop-opacity=".9"/><stop offset=".65" stop-color="#E9EDF2" stop-opacity=".85"/><stop offset="1" stop-color="#AEB6C0" stop-opacity=".8"/></linearGradient>
<linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6F8"/><stop offset="1" stop-color="#A9B1BC"/></linearGradient>
<radialGradient id="inside" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#6B737E"/><stop offset="1" stop-color="#9CA4AF"/></radialGradient>
<clipPath id="body"><path d="M20 26l7.4 58.6a6 6 0 0 0 6 5.4h33.2a6 6 0 0 0 6-5.4L80 26Z"/></clipPath>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.6" flood-opacity=".28"/></filter>
<filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy=".6" stdDeviation=".6" flood-opacity=".25"/></filter>
</defs>
<ellipse cx="50" cy="26" rx="30" ry="6.5" fill="url(#inside)"/>
${papers}
<g filter="url(#sh)">
<path d="M20 26l7.4 58.6a6 6 0 0 0 6 5.4h33.2a6 6 0 0 0 6-5.4L80 26Z" fill="url(#can)"/>
</g>
<g clip-path="url(#body)" stroke="#8D96A2" stroke-opacity=".45" stroke-width=".7" fill="none"><path d="${mesh.join('')}"/></g>
<path d="M27 32l6 52" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="50" cy="26" rx="30" ry="6.5" fill="none" stroke="url(#rim)" stroke-width="2.6"/>
<ellipse cx="50" cy="25.4" rx="29" ry="5.8" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width=".6"/>
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

type Palette = { bg: [string, string, string]; ribbons: Array<[string, string]>; glow: string }

/**
 * macOS-style abstract wallpaper: broad, overlapping curved ribbons with their
 * own gradients and soft shadows between layers for depth. Original artwork.
 */
function wallpaper(p: Palette, dark: boolean) {
  const W = 2880
  const H = 1800
  // Each ribbon gets its own sweep so the layers cross and fan out like fabric.
  const shapes: Array<{ y: number; a: number; b: number; c: number; tilt: number }> = [
    { y: 240, a: 620, b: 180, c: 520, tilt: -140 },
    { y: 560, a: 380, b: 420, c: 260, tilt: 60 },
    { y: 900, a: 520, b: 120, c: 460, tilt: -220 },
    { y: 1220, a: 300, b: 360, c: 240, tilt: 120 },
  ]
  const ribbons = p.ribbons
    .map(([c0, c1], i) => {
      const { y, a, b, c, tilt } = shapes[i % shapes.length]!
      const edge = `M-240 ${y + a} C 420 ${y - a * 0.6}, 1080 ${y + b}, 1560 ${y + tilt} S 2500 ${y - c}, 3120 ${y + tilt / 2}`
      const d = `${edge} L3120 ${H + 240} L-240 ${H + 240}Z`
      return `<linearGradient id="r${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
<path d="${d}" fill="url(#r${i})" filter="url(#depth)"/>
<path d="${edge}" fill="none" stroke="#fff" stroke-opacity="${dark ? 0.07 : 0.28}" stroke-width="2.5"/>`
    })
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="${p.bg[0]}"/><stop offset=".55" stop-color="${p.bg[1]}"/><stop offset="1" stop-color="${p.bg[2]}"/></linearGradient>
<radialGradient id="glow" cx=".78" cy=".12" r=".7"><stop offset="0" stop-color="${p.glow}" stop-opacity="${dark ? 0.35 : 0.6}"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>
<filter id="depth" x="-10%" y="-20%" width="120%" height="140%"><feDropShadow dx="0" dy="-18" stdDeviation="40" flood-color="#000" flood-opacity="${dark ? 0.5 : 0.28}"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<g filter="url(#soft)">
${ribbons}
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

  for (const [name, draw] of Object.entries(APP_ICONS)) write(icons, `${name}.svg`, draw())

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


  const wallpapers: Record<string, { light: Palette; dark: Palette }> = {
    tide: {
      light: {
        bg: ['#CFE8FF', '#7FB2F2', '#3A62D6'],
        glow: '#FFFFFF',
        ribbons: [
          ['#A9D6FF', '#5B8FF0'],
          ['#6FA6FA', '#2F58D6'],
          ['#4A7BF0', '#2A3FB8'],
          ['#3558DA', '#1B2A8E'],
        ],
      },
      dark: {
        bg: ['#0C1838', '#132A66', '#0A1230'],
        glow: '#4C7DFF',
        ribbons: [
          ['#1E3C88', '#122766'],
          ['#1A3478', '#0E1E52'],
          ['#172C68', '#0B1842'],
          ['#122356', '#070F30'],
        ],
      },
    },
    dune: {
      light: {
        bg: ['#FFE7C9', '#F9B08A', '#D8607A'],
        glow: '#FFF4E0',
        ribbons: [
          ['#FFD2A6', '#F59A78'],
          ['#F7A27E', '#E0667A'],
          ['#E6738A', '#B8457A'],
          ['#C24E86', '#7E2F74'],
        ],
      },
      dark: {
        bg: ['#2A1224', '#4E1E3C', '#1A0A18'],
        glow: '#FF7A6B',
        ribbons: [
          ['#6A2A48', '#471B36'],
          ['#5A2244', '#3A142E'],
          ['#4A1C3E', '#2C0F28'],
          ['#3A1636', '#1E0A1E'],
        ],
      },
    },
    grove: {
      light: {
        bg: ['#E3F8EA', '#98DDB6', '#3FA58A'],
        glow: '#FFFFFF',
        ribbons: [
          ['#BDF0CF', '#7BD3A6'],
          ['#86D9AE', '#3FB08A'],
          ['#4CB893', '#238A76'],
          ['#2A9A80', '#136560'],
        ],
      },
      dark: {
        bg: ['#07201A', '#0F3A2E', '#051410'],
        glow: '#3FE0A0',
        ribbons: [
          ['#15503F', '#0E3A2E'],
          ['#124536', '#0A2F25'],
          ['#0F3A2E', '#08251D'],
          ['#0C3027', '#051A14'],
        ],
      },
    },
  }
  for (const [name, w] of Object.entries(wallpapers)) {
    write(walls, `${name}-light.svg`, wallpaper(w.light, false))
    write(walls, `${name}-dark.svg`, wallpaper(w.dark, true))
  }

  // Official brand marks (paths from Simple Icons, which sources them from each
  // brand's press kit). Used only to link to Mohith's profiles, as both brands'
  // guidelines allow. GitHub: github.com/logos · LinkedIn: brand.linkedin.com.
  const brands = join(root, 'public/brands')
  mkdirSync(brands, { recursive: true })
  write(brands, 'github.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#181717" d="${GITHUB_PATH}"/></svg>\n`)
  write(brands, 'github-white.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFFFFF" d="${GITHUB_PATH}"/></svg>\n`)
  write(brands, 'linkedin.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#0A66C2" d="${LINKEDIN_PATH}"/></svg>\n`)
  console.log('icons, brand marks and wallpapers written')
}

await main()
