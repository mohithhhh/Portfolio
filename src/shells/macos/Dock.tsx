'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { APPS, DOCK_ORDER, type AppId } from '@/os/apps-meta'
import { activateApp, openApp, openNode, originOf } from '@/os/actions'
import { dockMenu } from '@/os/menus'
import { useReducedMotion } from '@/os/hooks'
import { useUi } from '@/os/stores/ui'
import { selectRunningApps, useWindows, type Win } from '@/os/stores/windows'
import { useShallow } from 'zustand/react/shallow'

const BASE = 52
const MAX_SCALE = 1.7
const RANGE = 150

function useMagnify(mouseX: MotionValue<number>, ref: React.RefObject<HTMLElement | null>, reduced: boolean) {
  const size = useTransform(mouseX, (x) => {
    if (reduced || !Number.isFinite(x) || !ref.current) return BASE
    const r = ref.current.getBoundingClientRect()
    const d = Math.abs(x - (r.left + r.width / 2))
    if (d > RANGE) return BASE
    // cosine falloff: smooth at the centre and at the edge of the range
    return BASE * (1 + (MAX_SCALE - 1) * Math.cos(((d / RANGE) * Math.PI) / 2))
  })
  return useSpring(size, { stiffness: 380, damping: 28, mass: 0.2 })
}

type ItemProps = {
  label: string
  mouseX: MotionValue<number>
  running?: boolean
  launching?: boolean
  onActivate: (origin: { x: number; y: number } | undefined) => void
  onMenu?: (x: number, y: number) => void
  children: ReactNode
  testId?: string
}

function DockItem({ label, mouseX, running, launching, onActivate, onMenu, children, testId }: ItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const size = useMagnify(mouseX, ref, reduced)
  const y = useMotionValue(0)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (!launching || reduced) return
    const controls = animate(y, [0, -22, 0], { duration: 0.6, repeat: Infinity, ease: 'easeOut' })
    return () => {
      controls.stop()
      y.set(0)
    }
  }, [launching, reduced, y])

  return (
    <li className="dock-item">
      {hover && (
        <span className="dock-tooltip" role="tooltip">
          {label}
        </span>
      )}
      <motion.button
        ref={ref}
        className="dock-icon"
        style={{ width: size, height: size, y }}
        aria-label={running ? `${label}, running` : label}
        data-testid={testId}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => {
          setHover(false)
          onActivate(originOf(ref.current))
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          onMenu?.(e.clientX, e.clientY)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
            e.preventDefault()
            const r = ref.current?.getBoundingClientRect()
            if (r) onMenu?.(r.left, r.top - 8)
          }
        }}
      >
        {children}
      </motion.button>
      {running && <span className="dock-dot" aria-hidden="true" />}
    </li>
  )
}

function MinimizedThumb({ win }: { win: Win }) {
  return (
    <span className="dock-minimized">
      <span className="mini-title">{win.title}</span>
      <img className="badge" src={APPS[win.appId].icon} alt="" />
    </span>
  )
}

export function Dock() {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY)
  const running = useWindows(useShallow(selectRunningApps))
  const launching = useWindows((s) => s.launching)
  const minimized = useWindows(useShallow((s) => s.windows.filter((w) => w.state === 'minimized')))
  const openContextMenu = useUi((s) => s.openContextMenu)
  const restore = useWindows((s) => s.restore)

  const apps: AppId[] = [
    ...DOCK_ORDER,
    ...running.filter((a) => !DOCK_ORDER.includes(a) && a !== 'trash'),
  ]

  return (
    <div className="dock-wrap">
      <nav aria-label="Dock">
        <motion.ul
          className="dock"
          style={{ listStyle: 'none', margin: 0 }}
          onPointerMove={(e) => e.pointerType === 'mouse' && mouseX.set(e.clientX)}
          onPointerLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
          data-testid="dock"
        >
          {apps.map((id) => (
            <DockItem
              key={id}
              label={APPS[id].name}
              mouseX={mouseX}
              running={running.includes(id)}
              launching={launching.includes(id)}
              onActivate={(origin) => activateApp(id, origin)}
              onMenu={(x, y) => openContextMenu(x, y, dockMenu(id, running.includes(id)), `${APPS[id].name} options`)}
              testId={`dock-${id}`}
            >
              <img src={APPS[id].icon} alt="" draggable={false} />
            </DockItem>
          ))}
          <li className="dock-divider" aria-hidden="true" />
          {minimized.map((w) => (
            <DockItem
              key={w.id}
              label={w.title}
              mouseX={mouseX}
              onActivate={() => restore(w.id)}
              onMenu={(x, y) =>
                openContextMenu(x, y, [
                  { label: 'Restore', action: () => restore(w.id) },
                  { label: 'Close', action: () => useWindows.getState().close(w.id) },
                ])
              }
              testId={`dock-min-${w.id}`}
            >
              <MinimizedThumb win={w} />
            </DockItem>
          ))}
          <DockItem
            label="Downloads"
            mouseX={mouseX}
            onActivate={(origin) => openNode('downloads', origin)}
            onMenu={(x, y) =>
              openContextMenu(x, y, [
                { label: 'Open "Downloads"', action: () => openNode('downloads') },
                { label: 'Show in Finder', action: () => openNode('home') },
              ])
            }
            testId="dock-downloads"
          >
            <img src="/icons/downloads.svg" alt="" draggable={false} />
          </DockItem>
          <DockItem
            label="Trash"
            mouseX={mouseX}
            running={running.includes('trash')}
            onActivate={(origin) => openApp('trash', { origin })}
            onMenu={(x, y) => openContextMenu(x, y, [{ label: 'Open', action: () => openApp('trash') }])}
            testId="dock-trash"
          >
            <img src="/icons/trash.svg" alt="" draggable={false} />
          </DockItem>
        </motion.ul>
      </nav>
    </div>
  )
}
