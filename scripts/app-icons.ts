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
    body: [
      [0, '#8EDBFF'],
      [0.55, '#3C9EF5'],
      [1, '#1557D6'],
    ],
    defs: `${lin('fb', [[0, '#1F6FD8'], [1, '#0E47A8']])}${lin('ff', [[0, '#D9F1FF'], [0.5, '#A8DCFF'], [1, '#6DBBF5']])}${lin('lens', [[0, '#fff', 0.85], [1, '#CDEBFF', 0.35]])}${lin('handle', [[0, '#F4F6FA'], [1, '#9AA6B6']], 0, 0, 1, 0)}`,
    art: `
<g filter="url(#art)">
  <path d="M24 32a4 4 0 0 1 4-4h14.5a4 4 0 0 1 3.1 1.5l2.6 3.2H72a4 4 0 0 1 4 4V70a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4Z" fill="url(#fb)"/>
  <path d="M24 42a4 4 0 0 1 4-4h44a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4Z" fill="url(#ff)"/>
  <path d="M24.4 42a3.6 3.6 0 0 1 3.6-3.6h44" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width=".8"/>
</g>
<g filter="url(#art)">
  <path d="M66.5 66.5 76 76" stroke="url(#handle)" stroke-width="6" stroke-linecap="round"/>
  <circle cx="58" cy="58" r="12" fill="url(#lens)" stroke="#fff" stroke-width="3.2"/>
  <path d="M51 53.5a8.5 8.5 0 0 1 7-4.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
</g>`,
  })

const safari = () => {
  const meridians = [-1, -0.55, 0, 0.55, 1]
    .map((k) => `<ellipse cx="50" cy="50" rx="${(24 * Math.abs(k)).toFixed(2)}" ry="24" fill="none" stroke="#1E7BE0" stroke-opacity=".45" stroke-width=".8"/>`)
    .join('')
  const parallels = [-16, -8, 0, 8, 16]
    .map((y) => {
      const r = Math.sqrt(24 * 24 - y * y)
      return `<path d="M${(50 - r).toFixed(2)} ${50 + y}H${(50 + r).toFixed(2)}" stroke="#1E7BE0" stroke-opacity=".45" stroke-width=".8"/>`
    })
    .join('')
  return icon({
    body: [
      [0, '#9BE3FF'],
      [0.5, '#39A2F5'],
      [1, '#1250CF'],
    ],
    defs: `${rad('globe', [[0, '#FFFFFF'], [0.7, '#E6F3FF'], [1, '#B9D9F7']], 0.42, 0.36, 0.7)}${lin('land', [[0, '#6FD39A'], [1, '#2FA56A']])}${lin('orbit', [[0, '#FFE58A'], [1, '#FFB23E']], 0, 0, 1, 1)}<clipPath id="globe-clip"><circle cx="50" cy="50" r="24"/></clipPath>`,
    art: `
<g filter="url(#art)">
  <circle cx="50" cy="50" r="25" fill="url(#globe)"/>
</g>
<g clip-path="url(#globe-clip)">
    <path d="M33 40c4-6 11-8 15-6s2 7-3 9-4 7-9 7-7-5-3-10Zm22 10c5-2 12 0 14 5s-3 11-8 11-6-4-7-8 0-7 1-8Zm4-19c4 1 8 4 7 6s-6 1-8-1 0-5 1-5Z" fill="url(#land)" opacity=".9"/>
    ${meridians}${parallels}
</g>
<circle cx="50" cy="50" r="24" fill="none" stroke="#fff" stroke-width="1.2" opacity=".9"/>
<g filter="url(#art-soft)">
  <ellipse cx="50" cy="50" rx="34" ry="9" fill="none" stroke="url(#orbit)" stroke-width="2.4" transform="rotate(-24 50 50)" stroke-dasharray="58 12"/>
  <circle cx="79" cy="38" r="3.2" fill="#FFD25E" stroke="#fff" stroke-width="1"/>
</g>`,
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
  const lines = [44, 52, 60, 68].map((y) => `<path d="M30 ${y}H70" stroke="#D9D2BF" stroke-width="1.2"/>`).join('')
  const holes = [30, 38, 46, 54, 62, 70].map((x) => `<circle cx="${x}" cy="30" r="1.6" fill="#8A6A10" opacity=".55"/>`).join('')
  return icon({
    body: [
      [0, '#FFE98C'],
      [0.55, '#FDC93C'],
      [1, '#F2A51C'],
    ],
    defs: `${lin('paper', [[0, '#FFFFFF'], [1, '#F1ECE0']])}${lin('pencil', [[0, '#FF8A5C'], [1, '#E0522B']], 0, 0, 1, 0)}`,
    art: `
<g filter="url(#art)" transform="rotate(-4 50 52)">
  <rect x="24" y="26" width="52" height="54" rx="4" fill="url(#paper)"/>
  <rect x="24" y="26" width="52" height="9" rx="4" fill="#FBD454"/>
  <rect x="24" y="31" width="52" height="4" fill="#FBD454"/>
  ${holes}
  ${lines}
  <path d="M30 44h26M30 52h32M30 60h20" stroke="#6E6758" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
</g>
<g filter="url(#art)" transform="rotate(38 66 60)">
  <rect x="62" y="36" width="8" height="34" rx="1.2" fill="url(#pencil)"/>
  <rect x="62" y="36" width="8" height="5" rx="1.2" fill="#F4B8C6"/>
  <rect x="62" y="40" width="8" height="2" fill="#C9CED6"/>
  <path d="M62 70h8l-4 8Z" fill="#F3D9A6"/>
  <path d="M64.7 75.4h2.6L66 78Z" fill="#3B3B3B"/>
</g>`,
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
      [0, '#8CF5A5'],
      [0.5, '#35D05F'],
      [1, '#12A53E'],
    ],
    defs: `${lin('bub', [[0, '#FFFFFF'], [1, '#E6F3EA']])}`,
    art: `
<g filter="url(#art)">
  <path d="M50 24c16.6 0 29 10.6 29 24.5S66.6 73 50 73c-3.4 0-6.7-.5-9.7-1.3L27 78l3.6-10.8C24.6 62.9 21 56.1 21 48.5 21 34.6 33.4 24 50 24Z" fill="url(#bub)"/>
</g>
<circle cx="39" cy="49" r="3" fill="#35C660"/><circle cx="50" cy="49" r="3" fill="#35C660" opacity=".8"/><circle cx="61" cy="49" r="3" fill="#35C660" opacity=".6"/>`,
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
