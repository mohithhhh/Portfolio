'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { MenuEntry } from '@/os/stores/ui'

type Props = {
  items: MenuEntry[]
  x: number
  y: number
  label: string
  onClose: (reason: 'escape' | 'action' | 'outside') => void
  /** Called with -1/1 when the user presses ←/→ (menu bar navigation). */
  onNavigate?: (dir: -1 | 1) => void
  /** Elements whose clicks should not count as "outside" (e.g. the menu bar). */
  ignoreOutside?: () => HTMLElement | null
  focusFirst?: boolean
  id?: string
}

const isActionable = (e: MenuEntry | undefined) => !!e && e.type !== 'separator' && !e.disabled

export function Menu({ items, x, y, label, onClose, onNavigate, ignoreOutside, focusFirst, id }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(() => (focusFirst ? items.findIndex(isActionable) : -1))
  const [pos, setPos] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const left = Math.max(4, Math.min(x, window.innerWidth - r.width - 4))
    const top = Math.max(4, Math.min(y, window.innerHeight - r.height - 4))
    setPos({ left, top })
    el.focus({ preventScroll: true })
  }, [x, y])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t)) return
      if (ignoreOutside?.()?.contains(t)) return
      onClose('outside')
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [onClose, ignoreOutside])

  const move = (dir: 1 | -1) => {
    if (!items.some(isActionable)) return
    let i = active
    for (let n = 0; n < items.length; n++) {
      i = (i + dir + items.length) % items.length
      if (isActionable(items[i])) break
    }
    setActive(i)
  }

  const activate = (entry: MenuEntry | undefined) => {
    if (!entry || entry.type === 'separator' || entry.disabled) return
    onClose('action')
    entry.action?.()
  }

  return (
    <div
      ref={ref}
      id={id}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      className="menu"
      style={pos}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          move(1)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          move(-1)
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          activate(items[active])
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onClose('escape')
        } else if (e.key === 'ArrowLeft' && onNavigate) {
          e.preventDefault()
          onNavigate(-1)
        } else if (e.key === 'ArrowRight' && onNavigate) {
          e.preventDefault()
          onNavigate(1)
        } else if (e.key === 'Tab') {
          e.preventDefault()
          move(e.shiftKey ? -1 : 1)
        }
      }}
    >
      {items.map((entry, i) =>
        entry.type === 'separator' ? (
          <div key={i} className="menu-separator" role="separator" />
        ) : (
          <div
            key={i}
            role={entry.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
            aria-checked={entry.checked}
            aria-disabled={entry.disabled || undefined}
            title={entry.hint}
            data-active={i === active}
            className="menu-item"
            onPointerEnter={() => setActive(entry.disabled ? -1 : i)}
            onPointerLeave={() => setActive(-1)}
            onClick={() => activate(entry)}
          >
            {entry.checked && <span className="check">✓</span>}
            <span>{entry.label}</span>
            {entry.shortcut && <span className="shortcut">{entry.shortcut}</span>}
          </div>
        ),
      )}
    </div>
  )
}
