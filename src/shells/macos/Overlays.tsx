'use client'
import { useEffect } from 'react'
import { APPS, menuAppOf, type AppId } from '@/os/apps-meta'
import { activateApp } from '@/os/actions'
import { useUi } from '@/os/stores/ui'
import { useWindows } from '@/os/stores/windows'
import { Menu } from '@/ui/Menu'

export function ContextMenuHost() {
  const menu = useUi((s) => s.contextMenu)
  const close = useUi((s) => s.closeContextMenu)
  if (!menu) return null
  return <Menu key={`${menu.x}-${menu.y}`} items={menu.items} x={menu.x} y={menu.y} label={menu.label} onClose={close} focusFirst />
}

/** Running apps, most recently focused first (Finder always present). */
export function switcherApps(): AppId[] {
  const ws = [...useWindows.getState().windows].sort((a, b) => b.z - a.z)
  const apps: AppId[] = []
  for (const w of ws) {
    const id = menuAppOf(w.appId)
    if (!apps.includes(id)) apps.push(id)
  }
  if (!apps.includes('finder')) apps.push('finder')
  return apps
}

export function AppSwitcher() {
  const open = useUi((s) => s.switcherOpen)
  const index = useUi((s) => s.switcherIndex)
  useWindows((s) => s.windows)
  if (!open) return null
  const apps = switcherApps()
  return (
    <div className="switcher glass" role="listbox" aria-label="App switcher">
      {apps.map((id, i) => (
        <div
          key={id}
          role="option"
          aria-selected={i === index % apps.length}
          className="switcher-item"
          onPointerDown={() => {
            useUi.getState().setSwitcher(false)
            activateApp(id)
          }}
        >
          <img src={APPS[id].icon} alt="" />
          <span>{APPS[id].name}</span>
        </div>
      ))}
    </div>
  )
}

export function SheetHost() {
  const sheet = useUi((s) => s.sheet)
  const show = useUi((s) => s.showSheet)
  useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') show(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, show])
  if (!sheet) return null
  return (
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && show(null)}>
      <div className="sheet glass" role="alertdialog" aria-label={sheet.title}>
        <img src="/icons/monogram.svg" alt="" width={56} height={56} />
        <strong>{sheet.title}</strong>
        <div className="text-secondary">{sheet.body}</div>
        <button className="btn btn-primary" autoFocus onClick={() => show(null)}>
          OK
        </button>
      </div>
    </div>
  )
}
