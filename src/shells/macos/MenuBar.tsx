'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { profile } from '@/content'
import { openCompose } from '@/os/actions'
import { formatMenuClock, useNow } from '@/os/hooks'
import { buildMenus, monogramMenu, type MenuDef } from '@/os/menus'
import { MENU_BAR_H } from '@/os/geometry'
import { useFs } from '@/os/stores/fs'
import { useUi } from '@/os/stores/ui'
import { useWindows } from '@/os/stores/windows'
import { Menu } from '@/ui/Menu'

export function MenuBar() {
  const activeApp = useWindows((s) => s.activeApp)
  const focusedId = useWindows((s) => s.focusedId)
  useWindows((s) => s.windows)
  useFs((s) => s.history)
  const win = useWindows.getState().windows.find((w) => w.id === focusedId)
  const setSpotlight = useUi((s) => s.setSpotlight)
  const now = useNow(1000 * 15)

  const menus: MenuDef[] = [{ id: 'monogram', label: profile.monogram, items: monogramMenu() }, ...buildMenus(activeApp, win)]

  const [open, setOpen] = useState<number | null>(null)
  const [anchorX, setAnchorX] = useState(0)
  // Close menus when the active app changes underneath us.
  const [menuApp, setMenuApp] = useState(activeApp)
  if (menuApp !== activeApp) {
    setMenuApp(activeApp)
    setOpen(null)
  }
  const [focusIndex, setFocusIndex] = useState(0)
  const [openedByKey, setOpenedByKey] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const close = useCallback(
    (reason: 'escape' | 'action' | 'outside') => {
      if (reason === 'escape' && open !== null) itemRefs.current[open]?.focus()
      setOpen(null)
    },
    [open],
  )

  useEffect(() => {
    const onFocusBar = () => {
      setFocusIndex(0)
      itemRefs.current[0]?.focus()
    }
    window.addEventListener('menubar:focus', onFocusBar)
    return () => window.removeEventListener('menubar:focus', onFocusBar)
  }, [])

  const openAt = (i: number, byKey: boolean) => {
    setAnchorX(itemRefs.current[i]?.getBoundingClientRect().left ?? 0)
    setOpenedByKey(byKey)
    setOpen(i)
    setFocusIndex(i)
  }
  const step = (i: number, dir: -1 | 1) => (i + dir + menus.length) % menus.length

  const openMenu = open !== null ? menus[open] : undefined

  return (
    <header className="menubar" ref={barRef} data-testid="menubar">
      <nav role="menubar" aria-label="Menu bar" className="menubar-group">
        {menus.map((m, i) => (
          <button
            key={`${m.id}-${i}`}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={open === i}
            tabIndex={i === focusIndex ? 0 : -1}
            className={`menubar-item ${i === 0 ? 'monogram' : ''} ${i === 1 ? 'is-app' : ''}`}
            data-testid={i === 1 ? 'menubar-app-name' : undefined}
            aria-label={i === 0 ? `${profile.name} menu` : undefined}
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.preventDefault()
              if (open === i) setOpen(null)
              else openAt(i, false)
            }}
            onPointerEnter={() => {
              if (open !== null && open !== i) openAt(i, false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault()
                const n = step(i, e.key === 'ArrowRight' ? 1 : -1)
                setFocusIndex(n)
                itemRefs.current[n]?.focus()
              } else if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openAt(i, true)
              } else if (e.key === 'Escape') {
                itemRefs.current[i]?.blur()
              }
            }}
          >
            {m.label}
          </button>
        ))}
      </nav>
      <div className="menubar-group menubar-right">
        {profile.availability.open && (
          <button
            className="menubar-item"
            onClick={() => openCompose('Opportunity for Mohith')}
            aria-label={`${profile.availability.label}: write to ${profile.name}`}
          >
            <span className="status-dot" aria-hidden="true" />
            {profile.availability.label}
          </button>
        )}
        <button className="menubar-item" aria-label="Spotlight search" onClick={() => setSpotlight(true)} data-testid="spotlight-button">
          <Search size={14} strokeWidth={2.2} />
        </button>
        <span className="menubar-item menubar-clock" aria-label="Clock" suppressHydrationWarning>
          {now ? formatMenuClock(now) : ''}
        </span>
      </div>
      {openMenu && (
        <Menu
          key={`${openMenu.id}-${open}`}
          items={openMenu.items}
          x={anchorX}
          y={MENU_BAR_H}
          label={openMenu.label}
          focusFirst={openedByKey}
          onClose={close}
          ignoreOutside={() => barRef.current}
          onNavigate={(dir) => open !== null && openAt(step(open, dir), true)}
        />
      )}
    </header>
  )
}
