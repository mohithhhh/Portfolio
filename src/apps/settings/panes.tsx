'use client'
// Settings panes shared by macOS System Settings and iOS Settings.
import { Accessibility, Droplets, ExternalLink, Image as ImageIcon, Palette, User } from 'lucide-react'
import type { ComponentType } from 'react'
import { profile } from '@/content'
import { useDarkMode } from '@/os/hooks'
import { useSystem, WALLPAPERS, type Theme } from '@/os/stores/system'

export type PaneId = 'appearance' | 'wallpaper' | 'transparency' | 'accessibility' | 'about'

export const PANES: Array<{ id: PaneId; label: string; icon: ComponentType<{ size?: number }>; color: string }> = [
  { id: 'appearance', label: 'Appearance', icon: Palette, color: '#1c1c1e' },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon, color: '#32ade6' },
  { id: 'transparency', label: 'Transparency', icon: Droplets, color: '#5856d6' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, color: '#0a84ff' },
  { id: 'about', label: 'About', icon: User, color: '#8e8e93' },
]

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="settings-choices">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className="settings-choice" onClick={() => onChange(o.value)}>
          <span className={`settings-swatch swatch-${o.value}`} aria-hidden="true" />
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AppearancePane() {
  const theme = useSystem((s) => s.theme)
  const setTheme = useSystem((s) => s.setTheme)
  return (
    <section className="settings-group">
      <h3>Appearance</h3>
      <Segmented<Theme>
        label="Appearance"
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
      <p className="settings-hint">Auto follows your device’s light or dark setting.</p>
    </section>
  )
}

function WallpaperPane() {
  const wallpaper = useSystem((s) => s.wallpaper)
  const setWallpaper = useSystem((s) => s.setWallpaper)
  const dark = useDarkMode()
  return (
    <section className="settings-group">
      <h3>Wallpaper</h3>
      <div role="radiogroup" aria-label="Wallpaper" className="settings-wallpapers">
        {WALLPAPERS.map((w) => (
          <button key={w.id} role="radio" aria-checked={wallpaper === w.id} className="settings-wallpaper" onClick={() => setWallpaper(w.id)}>
            <img src={`/wallpapers/${w.id}-${dark ? 'dark' : 'light'}.svg`} alt="" />
            <span>{w.name}</span>
          </button>
        ))}
      </div>
      <p className="settings-hint">Original artwork. Each wallpaper has a light and a dark variant.</p>
    </section>
  )
}

function TransparencyPane() {
  const transparency = useSystem((s) => s.transparency)
  const setTransparency = useSystem((s) => s.setTransparency)
  const autoFrosted = useSystem((s) => s.autoFrosted)
  return (
    <section className="settings-group">
      <h3>Transparency</h3>
      <Segmented
        label="Transparency"
        value={transparency}
        onChange={(v) => {
          setTransparency(v)
          useSystem.getState().setAutoFrosted(false)
        }}
        options={[
          { value: 'glass', label: 'Liquid Glass' },
          { value: 'frosted', label: 'Frosted' },
        ]}
      />
      <p className="settings-hint">
        Frosted uses solid surfaces instead of live blur. It is used automatically when your device asks to reduce transparency
        {autoFrosted ? ', and it is on now because animations were running slowly' : ' or animations run slowly'}.
      </p>
    </section>
  )
}

function AccessibilityPane() {
  const motion = useSystem((s) => s.motion)
  const setMotion = useSystem((s) => s.setMotion)
  return (
    <section className="settings-group">
      <h3>Motion</h3>
      <label className="settings-toggle">
        <span>
          Reduce motion
          <small>Replaces zooms, bounces and slides with fades.</small>
        </span>
        <input type="checkbox" role="switch" checked={motion === 'reduce'} onChange={(e) => setMotion(e.target.checked ? 'reduce' : 'system')} />
      </label>
      <h3>Simple version</h3>
      <a className="btn" href="/simple">
        Open the plain HTML version <ExternalLink size={13} />
      </a>
    </section>
  )
}

function AboutPane() {
  return (
    <section className="settings-group">
      <h3>About this Mac</h3>
      <p>
        {profile.name}’s portfolio, built as a browser recreation of a Mac. Content comes from {profile.name.split(' ')[0]}’s resume.
      </p>
      <p className="settings-hint">Not affiliated with Apple Inc.</p>
      <a className="btn" href="/simple">
        Open Simple Version <ExternalLink size={13} />
      </a>
    </section>
  )
}

export function PaneContent({ id }: { id: PaneId }) {
  switch (id) {
    case 'appearance':
      return <AppearancePane />
    case 'wallpaper':
      return <WallpaperPane />
    case 'transparency':
      return <TransparencyPane />
    case 'accessibility':
      return <AccessibilityPane />
    case 'about':
      return <AboutPane />
  }
}
