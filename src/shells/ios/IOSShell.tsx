'use client'
import { Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BatteryFull, Signal, Wifi } from 'lucide-react'
import { currentProject, githubUrl, linkedinUrl, profile } from '@/content'
import type { AppId } from '@/os/apps-meta'
import { useDarkMode, useNow, useReducedMotion } from '@/os/hooks'
import { REGISTRY } from '@/os/registry'
import { useSystem } from '@/os/stores/system'
import { useFs } from '@/os/stores/fs'
import { HOME_ID } from '@/os/fs'
import type { InitialAction } from '../types'
import { useStats } from '@/apps/activity-monitor/ActivityMonitor'

type Rect = { x: number; y: number; w: number; h: number }
type Open = { appId: AppId; from: Rect }

const GRID: AppId[] = ['notes', 'about', 'settings']
const DOCK: AppId[] = ['terminal', 'finder', 'preview', 'mail']

function StatusBar({ light }: { light?: boolean }) {
  const now = useNow(15000)
  return (
    <div className={`ios-status ${light ? 'is-light' : ''}`} aria-hidden="true">
      <span className="ios-status-time" suppressHydrationWarning>
        {now ? now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '') : ''}
      </span>
      <span className="ios-status-icons">
        <Signal size={15} strokeWidth={2.5} />
        <Wifi size={15} strokeWidth={2.5} />
        <BatteryFull size={20} strokeWidth={2} />
      </span>
    </div>
  )
}

function DynamicIsland() {
  const [expanded, setExpanded] = useState(false)
  return (
    <button
      className={`ios-island ${expanded ? 'is-expanded' : ''}`}
      onClick={() => setExpanded((e) => !e)}
      aria-label={`Building: ${currentProject.name}`}
      aria-expanded={expanded}
    >
      <span className="ios-island-dot" aria-hidden="true" />
      <span className="ios-island-text">Building: {currentProject.name}</span>
      {expanded && <span className="ios-island-sub">{currentProject.summary}</span>}
    </button>
  )
}

function LockScreen({ onUnlock, wallpaperUrl }: { onUnlock: () => void; wallpaperUrl: string }) {
  const now = useNow(1000)
  const reduced = useReducedMotion()
  return (
    <motion.div
      className="ios-lock"
      style={{ backgroundImage: `url(${wallpaperUrl})` }}
      drag={reduced ? false : 'y'}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.9, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -80 || info.velocity.y < -400) onUnlock()
      }}
      exit={reduced ? { opacity: 0 } : { y: '-100%', transition: { type: 'spring', stiffness: 260, damping: 32 } }}
      data-testid="ios-lock"
    >
      <StatusBar light />
      <div className="ios-lock-clock" suppressHydrationWarning>
        <p>{now?.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>{now?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')}</h1>
      </div>
      <p className="ios-lock-name">{profile.name}</p>
      <button className="ios-notification" onClick={onUnlock} data-testid="ios-notification">
        <img src="/icons/messages.svg" alt="" width={38} height={38} />
        <span>
          <strong>
            {profile.name} <small>now</small>
          </strong>
          Hi, I’m {profile.name.split(' ')[0]}. I build enterprise AI agents and ML systems. Tap to explore.
        </span>
      </button>
      <button className="ios-unlock-hint" onClick={onUnlock}>
        Swipe up or tap to open
      </button>
      <span className="ios-home-indicator is-light" aria-hidden="true" />
    </motion.div>
  )
}

function Widgets({ open }: { open: (id: AppId, el: HTMLElement) => void }) {
  const { stats } = useStats()
  return (
    <div className="ios-widgets">
      <button className="ios-widget is-wide" onClick={(e) => open('finder', e.currentTarget)}>
        <small>Currently building</small>
        <strong>{currentProject.name}</strong>
        <span>{currentProject.highlights.join(' · ')}</span>
      </button>
      <button className="ios-widget" onClick={(e) => open('mail', e.currentTarget)}>
        <small>Contact</small>
        <strong>{profile.availability.open ? profile.availability.label : 'Say hello'}</strong>
        <span>{profile.email}</span>
      </button>
      <button className="ios-widget" onClick={(e) => open('terminal', e.currentTarget)}>
        <small>Agent</small>
        <strong>{stats && stats.available ? stats.requestsToday.toLocaleString() : '—'}</strong>
        <span>questions answered today</span>
      </button>
    </div>
  )
}

function AppIcon({ id, onOpen }: { id: AppId; onOpen: (id: AppId, el: HTMLElement) => void }) {
  const ios = REGISTRY[id].ios!
  return (
    <button className="ios-app" onClick={(e) => onOpen(id, e.currentTarget.querySelector('img')!)} data-testid={`ios-app-${id}`}>
      <img src={ios.icon} alt="" />
      <span>{ios.name}</span>
    </button>
  )
}

function WebClip({ href, label, children, color }: { href: string; label: string; children: React.ReactNode; color: string }) {
  return (
    <a className="ios-app" href={href} target="_blank" rel="noopener noreferrer">
      <span className="ios-webclip" style={{ background: color }}>
        {children}
      </span>
      <span>{label}</span>
    </a>
  )
}

function HomeScreen({ open }: { open: (id: AppId, el: HTMLElement) => void }) {
  return (
    <div className="ios-home" data-testid="ios-home">
      <StatusBar light />
      <DynamicIsland />
      <Widgets open={open} />
      <div className="ios-grid">
        {GRID.map((id) => (
          <AppIcon key={id} id={id} onOpen={open} />
        ))}
        {githubUrl && (
          <WebClip href={githubUrl} label="GitHub" color="#24292f">
            <span className="ios-webclip-text">GH</span>
          </WebClip>
        )}
        {linkedinUrl && (
          <WebClip href={linkedinUrl} label="LinkedIn" color="#0a66c2">
            <span className="ios-webclip-text">in</span>
          </WebClip>
        )}
      </div>
      <nav className="ios-dock glass" aria-label="Dock">
        {DOCK.map((id) => (
          <AppIcon key={id} id={id} onOpen={open} />
        ))}
      </nav>
      <a className="ios-simple-link" href="/simple">
        Simple version · Not affiliated with Apple Inc.
      </a>
    </div>
  )
}

function AppContainer({ app, onClose }: { app: Open; onClose: () => void }) {
  const def = REGISTRY[app.appId]
  const Comp = def.iosComponent!
  const reduced = useReducedMotion()
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844
  const from = app.from
  const initial = reduced
    ? { opacity: 0 }
    : {
        opacity: 0.4,
        scaleX: from.w / vw,
        scaleY: from.h / vh,
        x: from.x + from.w / 2 - vw / 2,
        y: from.y + from.h / 2 - vh / 2,
        borderRadius: 40,
      }
  return (
    <motion.div
      className="ios-app-container"
      role="dialog"
      aria-label={def.ios?.name ?? def.name}
      initial={initial}
      animate={{ opacity: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, borderRadius: 0 }}
      exit={{ ...initial, opacity: 0, transition: { duration: reduced ? 0.12 : 0.28, ease: [0.3, 0, 0.2, 1] } }}
      transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 300, damping: 32 }}
      data-testid={`ios-open-${app.appId}`}
    >
      <Suspense fallback={<div className="ios-screen" />}>
        <Comp onClose={onClose} />
      </Suspense>
      <motion.button
        className="ios-home-bar"
        aria-label="Go to home screen"
        onClick={onClose}
        drag={reduced ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={(_, info) => info.offset.y < -40 && onClose()}
      >
        <span className="ios-home-indicator" />
      </motion.button>
    </motion.div>
  )
}

export default function IOSShell({ initial }: { initial?: InitialAction }) {
  const [locked, setLocked] = useState(!initial)
  // Deep links open Files on the linked folder (this component only renders on the client).
  const [open, setOpen] = useState<Open | null>(() =>
    initial ? { appId: 'finder', from: { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight } } : null,
  )
  const wallpaper = useSystem((s) => s.wallpaper)
  const dark = useDarkMode()
  const wallpaperUrl = `/wallpapers/${wallpaper}-${dark ? 'dark' : 'light'}.svg`

  useEffect(() => {
    if (!initial) return
    const folder = initial.kind === 'project' ? `project-${initial.slug}` : `experience-${initial.slug}`
    useFs.getState().initHistory('ios-files', HOME_ID)
    useFs.getState().go('ios-files', folder)
  }, [initial])

  const openApp = (appId: AppId, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setOpen({ appId, from: { x: r.left, y: r.top, w: r.width, h: r.height } })
  }

  return (
    <div className="ios" data-testid="ios-shell">
      <div className="wallpaper" style={{ backgroundImage: `url(${wallpaperUrl})` }} aria-hidden="true" />
      <main id="shell-main" aria-label="Home screen">
        <HomeScreen open={openApp} />
      </main>
      <AnimatePresence>{open && <AppContainer key={open.appId} app={open} onClose={() => setOpen(null)} />}</AnimatePresence>
      <AnimatePresence>{locked && <LockScreen onUnlock={() => setLocked(false)} wallpaperUrl={wallpaperUrl} />}</AnimatePresence>
    </div>
  )
}
