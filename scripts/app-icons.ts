// Original app icon artwork in the macOS style: a continuous-corner squircle
// on the standard icon grid (824/1024 body), a soft drop shadow, a lit body
// gradient, layered artwork with its own shading, a top sheen and a thin rim.
// Everything here is drawn from scratch; no Apple artwork is used.

/** Canvas is 100×100; the body spans 10…90 like macOS's 824/1024 grid. */
const B0 = 10
const B1 = 90

/** Superellipse (n = 5) sampled into a path: the macOS "continuous corner" shape. */
function squirclePath(x0 = B0, y0 = B0, x1 = B1, y1 = B1, n = 5, steps = 96): string {
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const rx = (x1 - x0) / 2
  const ry = (y1 - y0) / 2
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const x = cx + rx * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = cy + ry * Math.sign(s) * Math.abs(s) ** (2 / n)
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

export const SQUIRCLE = squirclePath()

type Stop = [offset: number, color: string, opacity?: number]
const stops = (s: Stop[]) =>
  s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')
const lin = (id: string, s: Stop[], x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`
const rad = (id: string, s: Stop[], cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}">${stops(s)}</radialGradient>`
/** Soft shadow for artwork layers inside the icon. */
const shadowFilter = (id: string, dy = 1.2, blur = 1.2, opacity = 0.3) =>
  `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="#000" flood-opacity="${opacity}"/></filter>`

/**
 * Wraps artwork in the shared icon shell.
 * `body` is the background gradient (as stops, top → bottom); `art` is drawn
 * clipped to the squircle; `defs` holds the artwork's own gradients.
 */
function icon({ body, art, defs = '', sheen = 0.32 }: { body: Stop[]; art: string; defs?: string; sheen?: number }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
${lin('body', body)}
${lin('sheen', [
    [0, '#fff', sheen],
    [0.45, '#fff', 0.06],
    [0.5, '#fff', 0],
  ])}
${lin('shade', [
    [0.6, '#000', 0],
    [1, '#000', 0.14],
  ])}
${lin('rim', [
    [0, '#fff', 0.55],
    [0.5, '#fff', 0.08],
    [1, '#000', 0.18],
  ])}
<filter id="drop" x="-20%" y="-20%" width="140%" height="145%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.7" flood-color="#000" flood-opacity=".3"/></filter>
<clipPath id="clip"><path d="${SQUIRCLE}"/></clipPath>
${shadowFilter('art', 1.2, 1.3, 0.28)}
${shadowFilter('art-soft', 0.6, 0.6, 0.22)}
${defs}
</defs>
<path d="${SQUIRCLE}" fill="url(#body)" filter="url(#drop)"/>
<g clip-path="url(#clip)">
${art}
<rect x="0" y="0" width="100" height="100" fill="url(#shade)"/>
<rect x="0" y="0" width="100" height="100" fill="url(#sheen)"/>
</g>
<path d="${SQUIRCLE}" fill="none" stroke="url(#rim)" stroke-width=".7"/>
</svg>
`
}

/** Regular polygon gear outline centred on (cx, cy). */
function gearPath(cx: number, cy: number, teeth: number, outer: number, inner: number, taper = 0.28): string {
  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2
    const angles: Array<[number, number]> = [
      [a - step * 0.5, inner],
      [a - step * taper, inner],
      [a - step * (taper - 0.1), outer],
      [a + step * (taper - 0.1), outer],
      [a + step * taper, inner],
    ]
    for (const [t, r] of angles) pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

// ---------------------------------------------------------------------------
// App artwork
// ---------------------------------------------------------------------------

const finder = () =>
  icon({
    // Two-tone blue body (light left, deep right) with an original folder-and-lens mark.
    body: [
      [0, '#7FD0FF'],
      [1, '#2A7DEB'],
    ],
    defs: `${lin('left', [[0, '#A8E1FF'], [1, '#55B1F7']])}${lin('right', [[0, '#2D8BF0'], [1, '#0F4FC6']])}${lin('fb', [[0, '#1F6FD8'], [1, '#0E47A8']])}${lin('ff', [[0, '#F2FAFF'], [0.5, '#CDEBFF'], [1, '#94CDF7']])}${lin('lens', [[0, '#fff', 0.9], [1, '#CDEBFF', 0.35]])}${lin('handle', [[0, '#F4F6FA'], [1, '#9AA6B6']], 0, 0, 1, 0)}`,
    art: `
<rect x="0" y="0" width="50" height="100" fill="url(#left)"/>
<path d="M50 0h50v100H50c4-12 6-24 6-50S54 12 50 0Z" fill="url(#right)"/>
<g filter="url(#art)">
  <path d="M25 33a4 4 0 0 1 4-4h13.5a4 4 0 0 1 3.1 1.5l2.6 3.2H71a4 4 0 0 1 4 4V69a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4Z" fill="url(#fb)"/>
  <path d="M25 42a4 4 0 0 1 4-4h42a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4Z" fill="url(#ff)"/>
  <path d="M25.4 42a3.6 3.6 0 0 1 3.6-3.6h42" fill="none" stroke="#fff" stroke-width=".8"/>
</g>
<g filter="url(#art)">
  <path d="M65.5 65.5 75 75" stroke="url(#handle)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="57" cy="57" r="11.5" fill="url(#lens)" stroke="#fff" stroke-width="3.2"/>
  <path d="M50.5 52.5a8 8 0 0 1 6.5-4.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
</g>`,
  })

const safari = () => {
  // A navigation compass: blue dial, fine tick ring, red/white needle. Original drawing.
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2
    const long = i % 9 === 0
    const r1 = long ? 25.5 : 27
    const r2 = 29
    const p = (r: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`
    return `<path d="M${p(r1)}L${p(r2)}" stroke="#fff" stroke-opacity="${long ? 0.95 : 0.55}" stroke-width="${long ? 1 : 0.5}"/>`
  }).join('')
  return icon({
    body: [
      [0, '#FAFCFE'],
      [1, '#D9E1EA'],
    ],
    defs: `${rad('dial', [[0, '#5BC8FF'], [0.65, '#1E8BF0'], [1, '#0B5AC9']], 0.45, 0.35, 0.75)}${lin('north', [[0, '#FF5A4E'], [1, '#D41E1E']], 0, 0, 1, 0)}${lin('south', [[0, '#FFFFFF'], [1, '#D7DDE5']], 0, 0, 1, 0)}`,
    art: `
<g filter="url(#art)">
  <circle cx="50" cy="50" r="32" fill="url(#dial)"/>
</g>
<circle cx="50" cy="50" r="31.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".6"/>
${ticks}
<g filter="url(#art-soft)" transform="rotate(42 50 50)">
  <path d="M50 22 54 50H46Z" fill="url(#north)"/>
  <path d="M50 78 46 50h8Z" fill="url(#south)"/>
  <path d="M50 22 50 50H46Z" fill="#000" opacity=".12"/>
  <path d="M50 78 50 50h4Z" fill="#000" opacity=".1"/>
</g>
<circle cx="50" cy="50" r="2.4" fill="#fff" stroke="#9AA6B6" stroke-width=".6"/>`,
  })
}

const mail = () =>
  icon({
    body: [
      [0, '#86DEFF'],
      [0.5, '#34A4F6'],
      [1, '#1760E0'],
    ],
    defs: `${lin('env', [[0, '#FFFFFF'], [1, '#E3ECF6']])}${lin('flap', [[0, '#F7FAFD'], [1, '#CBD8E6']])}${lin('fold', [[0, '#DDE6F0'], [1, '#B9C7D6']])}`,
    art: `
<g filter="url(#art)">
  <rect x="21" y="31" width="58" height="40" rx="5" fill="url(#env)"/>
  <path d="M21.5 68.5 45 49a8 8 0 0 1 10 0l23.5 19.5" fill="url(#fold)" opacity=".9"/>
  <path d="M22 34.5a4 4 0 0 1 3.2-3.5h49.6a4 4 0 0 1 3.2 3.5L55.2 53a8 8 0 0 1-10.4 0Z" fill="url(#flap)"/>
  <path d="M23 34 45.5 52.2a7 7 0 0 0 9 0L77 34" fill="none" stroke="#fff" stroke-width=".9"/>
</g>`,
  })

const notes = () => {
  // Ruled notepad: warm yellow header band, perforation and grey rules. Original drawing.
  const rules = [48, 56, 64, 72, 80].map((y) => `<path d="M10 ${y}H90" stroke="#D8D5CC" stroke-width=".9"/>`).join('')
  const perf = Array.from({ length: 19 }, (_, i) => `<circle cx="${13 + i * 4.1}" cy="36.5" r=".8" fill="#B78A12" opacity=".5"/>`).join('')
  return icon({
    body: [
      [0, '#FFFFFF'],
      [1, '#EEEDE8'],
    ],
    defs: `${lin('band', [[0, '#FFE170'], [1, '#F6C02C']])}`,
    art: `
<rect x="0" y="0" width="100" height="35" fill="url(#band)"/>
<rect x="0" y="33.5" width="100" height="1.5" fill="#000" opacity=".08"/>
${perf}
${rules}
<path d="M18 48h44M18 56h52M18 64h34" stroke="#8B867A" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`,
  })
}

const terminal = () =>
  icon({
    body: [
      [0, '#5A6068'],
      [0.5, '#2E3238'],
      [1, '#15171B'],
    ],
    defs: `${lin('screen', [[0, '#101316'], [1, '#050607']])}${rad('glow', [[0, '#3CF2B4', 0.22], [1, '#3CF2B4', 0]], 0.3, 0.4, 0.6)}`,
    art: `
<g filter="url(#art-soft)">
  <rect x="18" y="22" width="64" height="56" rx="7" fill="url(#screen)" stroke="#6B7178" stroke-width=".8"/>
</g>
<rect x="18" y="22" width="64" height="56" rx="7" fill="url(#glow)"/>
<path d="M18.4 29a6.6 6.6 0 0 1 6.6-6.6h50a6.6 6.6 0 0 1 6.6 6.6v1H18.4Z" fill="#2A2E33"/>
<circle cx="24.5" cy="26.2" r="1.3" fill="#FF6B61"/><circle cx="29" cy="26.2" r="1.3" fill="#F5C04A"/><circle cx="33.5" cy="26.2" r="1.3" fill="#4CD964"/>
<path d="M27 44l9 7-9 7" fill="none" stroke="#5CF5C2" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="40" y="56.5" width="14" height="3.2" rx="1.2" fill="#E8FFF6"/>
<rect x="57" y="48" width="4.5" height="11.7" rx=".8" fill="#5CF5C2" opacity=".85"/>
<path d="M18 36h64M18 42h64M18 48h64M18 54h64M18 60h64M18 66h64M18 72h64" stroke="#fff" stroke-opacity=".025" stroke-width=".8"/>`,
    sheen: 0.18,
  })

const preview = () =>
  icon({
    body: [
      [0, '#F9FBFD'],
      [1, '#D5DCE6'],
    ],
    defs: `${lin('sky', [[0, '#7CC7FF'], [1, '#D5EEFF']])}${lin('hill', [[0, '#5AC37A'], [1, '#2E8F52']])}${lin('hill2', [[0, '#8AD99D'], [1, '#4BAE68']])}${lin('sky2', [[0, '#FFB27A'], [1, '#FFE3B8']])}${lin('lens2', [[0, '#fff', 0.8], [1, '#D6ECFF', 0.3]])}`,
    art: `
<g filter="url(#art)" transform="rotate(-9 44 46)">
  <rect x="20" y="26" width="46" height="36" rx="2" fill="#fff"/>
  <rect x="23" y="29" width="40" height="28" fill="url(#sky2)"/>
  <circle cx="54" cy="36" r="4" fill="#FFF3C4"/>
  <path d="M23 57l11-12 8 8 6-5 15 9Z" fill="#B4764A" opacity=".85"/>
</g>
<g filter="url(#art)" transform="rotate(6 54 54)">
  <rect x="30" y="36" width="46" height="36" rx="2" fill="#fff"/>
  <rect x="33" y="39" width="40" height="28" fill="url(#sky)"/>
  <circle cx="42" cy="46" r="3.6" fill="#FFF7D0"/>
  <path d="M33 67l12-14 9 9 7-6 12 11Z" fill="url(#hill)"/>
  <path d="M33 67l8-7 10 7Z" fill="url(#hill2)"/>
</g>
<g filter="url(#art)">
  <path d="M69.5 70.5 78 79" stroke="#5F6B7A" stroke-width="5.5" stroke-linecap="round"/>
  <circle cx="62" cy="63" r="10.5" fill="url(#lens2)" stroke="#3B4552" stroke-width="2.6"/>
  <path d="M56 59.5a7 7 0 0 1 5.5-3.8" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>
</g>`,
  })

const textedit = () => {
  const lines = [36, 42, 48, 54, 60, 66]
    .map((y, i) => `<path d="M31 ${y}H${[66, 62, 67, 58, 64, 48][i]}" stroke="#8C95A3" stroke-width="1.8" stroke-linecap="round"/>`)
    .join('')
  return icon({
    body: [
      [0, '#EEF3F8'],
      [1, '#BFCAD8'],
    ],
    defs: `${lin('page', [[0, '#FFFFFF'], [1, '#EEF1F5']])}${lin('pen', [[0, '#3C4A60'], [0.5, '#1E2735'], [1, '#3C4A60']], 0, 0, 1, 0)}${lin('nib', [[0, '#F7D98A'], [1, '#C9962E']], 0, 0, 1, 0)}`,
    art: `
<g filter="url(#art)">
  <path d="M24 22h40l12 12v46a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V25a3 3 0 0 1 3-3Z" fill="url(#page)"/>
  <path d="M64 22v9a3 3 0 0 0 3 3h9" fill="#DCE2EA"/>
  <text x="31" y="31" font-family="Georgia,'Times New Roman',serif" font-size="8" font-weight="700" fill="#2F3A4A">Aa</text>
  ${lines}
</g>
<g filter="url(#art)" transform="rotate(40 64 60)">
  <rect x="60" y="30" width="8" height="30" rx="3" fill="url(#pen)"/>
  <rect x="60" y="30" width="8" height="4" rx="2" fill="#6C7A90"/>
  <path d="M60.3 60h7.4l-3.7 12Z" fill="url(#nib)"/>
  <path d="M64 63v6" stroke="#6B4A12" stroke-width=".8"/>
</g>`,
  })
}

const settings = () =>
  icon({
    body: [
      [0, '#D4D8DE'],
      [0.5, '#9CA3AD'],
      [1, '#5E656F'],
    ],
    defs: `${lin('gear', [[0, '#F4F6F8'], [0.5, '#BFC5CD'], [1, '#858D98']], 0, 0, 1, 1)}${rad('hub', [[0, '#E9ECEF'], [0.7, '#9AA2AC'], [1, '#6B727C']], 0.4, 0.35, 0.65)}${lin('gear2', [[0, '#9EA5AF'], [1, '#5B626C']], 0, 0, 1, 1)}`,
    art: `
<circle cx="50" cy="50" r="33" fill="#3E444C" opacity=".35"/>
<circle cx="50" cy="50" r="31.5" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".6"/>
<g filter="url(#art)">
  <path d="${gearPath(50, 50, 12, 27, 22)}" fill="url(#gear)" stroke="#6B727C" stroke-width=".5"/>
  <circle cx="50" cy="50" r="17" fill="url(#gear2)"/>
  <path d="${gearPath(50, 50, 8, 14, 11, 0.3)}" fill="url(#gear)" stroke="#6B727C" stroke-width=".4"/>
  <circle cx="50" cy="50" r="6.5" fill="url(#hub)" stroke="#5B626C" stroke-width=".6"/>
  <circle cx="50" cy="50" r="2.4" fill="#4A5059"/>
</g>`,
  })

const about = () => {
  const pins = [34, 42, 50, 58, 66]
    .map(
      (p) =>
        `<rect x="${p - 1.2}" y="19" width="2.4" height="8" rx="1" fill="#C9D2E0"/><rect x="${p - 1.2}" y="73" width="2.4" height="8" rx="1" fill="#C9D2E0"/><rect x="19" y="${p - 1.2}" width="8" height="2.4" rx="1" fill="#C9D2E0"/><rect x="73" y="${p - 1.2}" width="8" height="2.4" rx="1" fill="#C9D2E0"/>`,
    )
    .join('')
  return icon({
    body: [
      [0, '#3B4660'],
      [0.5, '#1C2335'],
      [1, '#0B0F1A'],
    ],
    defs: `${lin('die', [[0, '#5B6B8F'], [1, '#2A3350']], 0, 0, 1, 1)}${lin('face', [[0, '#8FB6FF'], [0.5, '#6C7CF5'], [1, '#B06CF0']], 0, 0, 1, 1)}`,
    art: `
${pins}
<g filter="url(#art)">
  <rect x="25" y="25" width="50" height="50" rx="7" fill="url(#die)" stroke="#8A97B6" stroke-width=".6"/>
  <rect x="31" y="31" width="38" height="38" rx="5" fill="url(#face)"/>
  <rect x="31.5" y="31.5" width="37" height="37" rx="4.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".7"/>
  <text x="50" y="54" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Inter,'Segoe UI',Roboto,sans-serif" font-size="10.5" font-weight="800" letter-spacing="-.4" fill="#fff">MDK</text>
</g>`,
  })
}

const activityMonitor = () =>
  icon({
    body: [
      [0, '#4A5058'],
      [0.5, '#24282E'],
      [1, '#0E1013'],
    ],
    defs: `${lin('area', [[0, '#3EE07A', 0.55], [1, '#3EE07A', 0]])}${lin('scr', [[0, '#0D1A12'], [1, '#050806']])}`,
    art: `
<g filter="url(#art-soft)">
  <rect x="18" y="24" width="64" height="52" rx="6" fill="url(#scr)" stroke="#5F666E" stroke-width=".7"/>
</g>
<path d="M18 37h64M18 50h64M18 63h64M31 24v52M44 24v52M57 24v52M70 24v52" stroke="#3EE07A" stroke-opacity=".12" stroke-width=".6"/>
<path d="M18 64l8-3 6 4 7-14 6 8 6-20 7 16 6-6 6 5 5-9 5 6V76H18Z" fill="url(#area)"/>
<path d="M18 64l8-3 6 4 7-14 6 8 6-20 7 16 6-6 6 5 5-9 5 6" fill="none" stroke="#56F28E" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="51" cy="39" r="2.2" fill="#E9FFF0"/>`,
    sheen: 0.18,
  })

const messages = () =>
  icon({
    body: [
      [0, '#86F59E'],
      [0.5, '#38D35F'],
      [1, '#14A63E'],
    ],
    defs: `${lin('bub', [[0, '#FFFFFF'], [1, '#EDF6EF']])}`,
    art: `
<g filter="url(#art)">
  <path d="M50 25c16.6 0 29.5 10.4 29.5 24S66.6 73 50 73c-3.2 0-6.3-.4-9.2-1.2-3.6 3-8.5 4.9-14.3 5.2 2.4-2.5 3.9-5.3 4.4-8.3C24.7 64.3 20.5 57 20.5 49 20.5 35.4 33.4 25 50 25Z" fill="url(#bub)"/>
</g>`,
  })

const files = () =>
  icon({
    body: [
      [0, '#FFFFFF'],
      [1, '#DCE6F2'],
    ],
    defs: `${lin('fb2', [[0, '#3F95F2'], [1, '#1F66D6']])}${lin('ff2', [[0, '#8CD0FF'], [1, '#3C95F0']])}`,
    art: `
<g filter="url(#art)">
  <path d="M20 30a4 4 0 0 1 4-4h16a4 4 0 0 1 3.1 1.5l3 3.5H76a4 4 0 0 1 4 4v37a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4Z" fill="url(#fb2)"/>
  <path d="M20 41a4 4 0 0 1 4-4h52a4 4 0 0 1 4 4v31a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4Z" fill="url(#ff2)"/>
  <path d="M20.4 41a3.6 3.6 0 0 1 3.6-3.6h52" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width=".8"/>
</g>`,
  })

const resume = () =>
  icon({
    body: [
      [0, '#FFA08C'],
      [0.5, '#F2583E'],
      [1, '#C8261D'],
    ],
    defs: `${lin('card', [[0, '#FFFFFF'], [1, '#F3EDEC']])}${lin('avatar', [[0, '#FFB9A8'], [1, '#F26A52']])}`,
    art: `
<g filter="url(#art)">
  <path d="M28 20h32l13 13v45a3 3 0 0 1-3 3H28a3 3 0 0 1-3-3V23a3 3 0 0 1 3-3Z" fill="url(#card)"/>
  <path d="M60 20v10a3 3 0 0 0 3 3h10" fill="#EAD9D6"/>
  <circle cx="42" cy="40" r="7" fill="url(#avatar)"/>
  <path d="M31 57c1.5-6 6-9 11-9s9.5 3 11 9Z" fill="url(#avatar)"/>
  <path d="M33 64h32M33 70h26M56 38h10M56 44h8" stroke="#C9B5B1" stroke-width="2" stroke-linecap="round"/>
</g>`,
  })

const downloads = () =>
  icon({
    body: [
      [0, '#9EDCFF'],
      [0.5, '#3D9BF3'],
      [1, '#1455D0'],
    ],
    defs: `${lin('tray', [[0, '#FFFFFF'], [1, '#D6E6F7']])}${lin('arrow', [[0, '#FFFFFF'], [1, '#E3F0FF']])}`,
    art: `
<g filter="url(#art)">
  <path d="M22 58h14l3 6h22l3-6h14v14a5 5 0 0 1-5 5H27a5 5 0 0 1-5-5Z" fill="url(#tray)"/>
  <path d="M44 20h12v22h10L50 60 34 42h10Z" fill="url(#arrow)"/>
</g>`,
  })

const drive = () =>
  icon({
    body: [
      [0, '#F2F4F7'],
      [1, '#C3CAD4'],
    ],
    defs: `${lin('case', [[0, '#E9EDF2'], [1, '#A9B2BE']])}${lin('face2', [[0, '#8B95A3'], [1, '#5D6673']])}`,
    art: `
<g filter="url(#art)">
  <rect x="18" y="38" width="64" height="28" rx="5" fill="url(#case)" stroke="#9AA3AF" stroke-width=".6"/>
  <rect x="22" y="55" width="56" height="7" rx="2" fill="url(#face2)"/>
  <circle cx="72" cy="47" r="2" fill="#3FD06B"/>
  <path d="M24 44h30" stroke="#fff" stroke-opacity=".8" stroke-width="1.2" stroke-linecap="round"/>
</g>`,
  })

export const APP_ICONS: Record<string, () => string> = {
  finder,
  safari,
  mail,
  notes,
  terminal,
  preview,
  textedit,
  settings,
  about,
  'activity-monitor': activityMonitor,
  messages,
  files,
  resume,
  downloads,
  drive,
}
