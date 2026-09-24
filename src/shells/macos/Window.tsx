'use client'
import { Component, Suspense, useEffect, useRef, type ReactNode, type PointerEvent as RPointerEvent } from 'react'
import { motion } from 'motion/react'
import { Minus, X } from 'lucide-react'
import { REGISTRY } from '@/os/registry'
import { MENU_BAR_H } from '@/os/geometry'
import { useWindows, type Win } from '@/os/stores/windows'
import { useFs } from '@/os/stores/fs'
import { useReducedMotion } from '@/os/hooks'

const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const

const INTERACTIVE = 'button, a, input, textarea, select, [role="button"], [role="tab"], [data-no-drag], [contenteditable="true"]'

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

class WindowErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    if (this.state.error)
      return (
        <div className="grid flex-1 place-items-center p-6 text-center text-secondary">
          This window hit an error. Close it and try again.
        </div>
      )
    return this.props.children
  }
}

function LaunchSignal({ appId }: { appId: Win['appId'] }) {
  const markLaunched = useWindows((s) => s.markLaunched)
  useEffect(() => {
    markLaunched(appId)
  }, [appId, markLaunched])
  return null
}

function ZoomGlyph() {
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true">
      <path d="M1.2 4.6V6.8H3.4Z M6.8 3.4V1.2H4.6Z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round" />
    </svg>
  )
}

export function TrafficLights({ win, compact }: { win: Win; compact?: boolean }) {
  const { close, minimize, toggleZoom } = useWindows.getState()
  const resizable = REGISTRY[win.appId].resizable
  return (
    <div className={`traffic ${compact ? 'compact' : ''}`} data-no-drag>
      <button className="close" aria-label="Close window" onClick={() => close(win.id)}>
        <X strokeWidth={3} />
      </button>
      <button className="minimize" aria-label="Minimize window" onClick={() => minimize(win.id)}>
        <Minus strokeWidth={3} />
      </button>
      <button
        className="zoom"
        aria-label={win.state === 'maximized' ? 'Exit full size' : 'Zoom window'}
        disabled={!resizable}
        onClick={() => toggleZoom(win.id)}
      >
        <ZoomGlyph />
      </button>
    </div>
  )
}

export function Window({ id }: { id: string }) {
  const win = useWindows((s) => s.windows.find((w) => w.id === id))
  const focused = useWindows((s) => s.focusedId === id)
  const reduced = useReducedMotion()
  const frameRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => useFs.getState().drop(id), [id])

  if (!win) return null
  const app = REGISTRY[win.appId]
  const App = app.component
  const minimized = win.state === 'minimized'
  const { focus, move, resize, toggleZoom } = useWindows.getState()

  const onPointerDownCapture = () => {
    if (!focused) focus(win.id)
  }

  // Drag and resize write styles directly for 60fps; afterwards, re-sync the
  // DOM with the (clamped) committed bounds in case React sees no change.
  const syncStyle = () => {
    const el = frameRef.current
    const w = useWindows.getState().windows.find((x) => x.id === id)
    if (!el || !w) return
    el.style.left = `${w.x}px`
    el.style.top = `${w.y}px`
    el.style.width = `${w.w}px`
    el.style.height = `${w.h}px`
  }

  const startDrag = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (!target.closest('[data-drag-region]') || target.closest(INTERACTIVE)) return
    const el = frameRef.current
    if (!el) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    let moved = false
    const w0 = win.state !== 'normal' && win.prevBounds ? win.prevBounds.w : win.w
    // Keep the cursor over the same relative point when un-zooming by drag.
    const rel = (startX - win.x) / win.w
    let bx = win.x
    const by = win.y
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved && Math.hypot(dx, dy) < 3) return
      if (!moved && win.state !== 'normal') {
        bx = startX - rel * w0
        el.style.width = `${w0}px`
        if (win.prevBounds) el.style.height = `${win.prevBounds.h}px`
      }
      moved = true
      const nx = bx + dx
      const ny = Math.max(MENU_BAR_H, by + dy)
      el.style.left = `${nx}px`
      el.style.top = `${ny}px`
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (moved) {
        move(win.id, bx + ev.clientX - startX, by + ev.clientY - startY)
        syncStyle()
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (edge: Edge) => (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const el = frameRef.current
    if (!el) return
    const s = { x: win.x, y: win.y, w: win.w, h: win.h }
    const sx = e.clientX
    const sy = e.clientY
    let b = s
    const compute = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      let { x, y, w, h } = s
      if (edge.includes('e')) w = Math.max(win.minW, s.w + dx)
      if (edge.includes('s')) h = Math.max(win.minH, s.h + dy)
      if (edge.includes('w')) {
        w = Math.max(win.minW, s.w - dx)
        x = s.x + s.w - w
      }
      if (edge.includes('n')) {
        const top = Math.max(MENU_BAR_H, s.y + dy)
        h = Math.max(win.minH, s.y + s.h - top)
        y = s.y + s.h - h
      }
      return { x, y, w, h }
    }
    const onMove = (ev: PointerEvent) => {
      b = compute(ev)
      el.style.left = `${b.x}px`
      el.style.top = `${b.y}px`
      el.style.width = `${b.w}px`
      el.style.height = `${b.h}px`
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      resize(win.id, b)
      syncStyle()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const origin = win.origin
  const dx = origin ? origin.x - (win.x + win.w / 2) : 0
  const dy = origin ? origin.y - (win.y + win.h / 2) : 40
  const dockY = typeof window !== 'undefined' ? window.innerHeight - (win.y + win.h / 2) : 400

  const classes = [
    'window',
    focused ? 'is-focused' : 'is-inactive',
    win.state === 'maximized' ? 'is-maximized' : '',
    win.state.startsWith('tiled') ? 'is-tiled' : '',
  ].join(' ')

  return (
    <div
      ref={frameRef}
      className="absolute"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        visibility: minimized ? 'hidden' : 'visible',
        transition: minimized ? 'visibility 0s linear 0.3s' : undefined,
      }}
      data-window-id={win.id}
      data-app={win.appId}
      onPointerDownCapture={onPointerDownCapture}
    >
      <motion.div
        role="dialog"
        aria-modal="false"
        aria-label={win.title}
        className={classes}
        style={{ width: '100%', height: '100%' }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.35, x: dx, y: dy }}
        animate={
          minimized
            ? reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.12, x: 0, y: dockY, transition: { duration: 0.32, ease: [0.4, 0, 0.6, 1] } }
            : { opacity: 1, scale: 1, x: 0, y: 0 }
        }
        exit={reduced ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
        transition={reduced ? { duration: 0.15 } : SPRING}
        onPointerDown={startDrag}
        onDoubleClick={(e) => {
          const t = e.target as HTMLElement
          if (t.closest('[data-drag-region]') && !t.closest(INTERACTIVE) && app.resizable) toggleZoom(win.id)
        }}
        tabIndex={-1}
      >
        {app.chrome === 'titlebar' && (
          <div className="titlebar" data-drag-region>
            <span className="truncate px-20">{win.title}</span>
          </div>
        )}
        <TrafficLights win={win} compact={app.chrome === 'titlebar'} />
        <div className="window-body">
          <WindowErrorBoundary>
            <Suspense fallback={<div className="flex-1" data-drag-region />}>
              <LaunchSignal appId={win.appId} />
              <App win={win} focused={focused} />
            </Suspense>
          </WindowErrorBoundary>
        </div>
      </motion.div>
      {app.resizable && win.state === 'normal' && !minimized &&
        EDGES.map((edge) => <div key={edge} className={`rz rz-${edge}`} onPointerDown={startResize(edge)} aria-hidden="true" />)}
    </div>
  )
}
