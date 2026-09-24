'use client'
import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { FSNode } from '@/content/schema'
import { openApp, openNode, originOf } from '@/os/actions'
import { APPS } from '@/os/apps-meta'
import { DESKTOP_ID, listChildren } from '@/os/fs'
import { MENU_BAR_H } from '@/os/geometry'
import { useFs } from '@/os/stores/fs'
import { useSystem } from '@/os/stores/system'
import { useUi, type MenuEntry } from '@/os/stores/ui'
import { useWindows } from '@/os/stores/windows'
import { vfs } from '@/os/vfs'
import { FileIcon } from '@/ui/FileIcon'

const CELL_W = 100
const CELL_H = 106
const MARGIN = 14
const SURFACE = 'desktop'

function defaultSlot(index: number, areaW: number, areaH: number) {
  const rows = Math.max(1, Math.floor((areaH - MARGIN) / CELL_H))
  const col = Math.floor(index / rows)
  const row = index % rows
  return { x: areaW - MARGIN - CELL_W * (col + 1), y: MARGIN + row * CELL_H }
}

export function fileMenu(node: FSNode, origin?: { x: number; y: number }): MenuEntry[] {
  const items: MenuEntry[] = [{ label: 'Open', action: () => openNode(node.id, origin) }]
  if (node.type === 'file') {
    const alternatives = Object.values(APPS).filter(
      (a) => a.id !== node.opensWith && node.kind !== 'app-shortcut' && (a.fileTypes as string[]).includes(node.kind),
    )
    for (const a of alternatives) {
      items.push({ label: `Open With ${a.name}`, action: () => openApp(a.id, { payload: { nodeId: node.id }, title: node.name }) })
    }
    items.push({ type: 'separator' }, { label: `Quick Look "${node.name}"`, shortcut: 'Space', action: () => useUi.getState().setQuickLook(node.id) })
  }
  items.push({ label: 'Get Info', shortcut: '⌘I', disabled: true }, { label: 'Rename', disabled: true }, { label: 'Move to Trash', shortcut: '⌘⌫', disabled: true })
  return items
}

export function Desktop() {
  const items = useMemo(() => listChildren(vfs, DESKTOP_ID), [])
  const positions = useSystem((s) => s.iconPositions)
  const setIconPosition = useSystem((s) => s.setIconPosition)
  const selection = useFs((s) => s.selection[SURFACE]) ?? []
  const select = useFs((s) => s.select)
  const focusDesktop = useWindows((s) => s.focusDesktop)
  const viewport = useWindows((s) => s.viewport)
  const openContextMenu = useUi((s) => s.openContextMenu)
  const rootRef = useRef<HTMLDivElement>(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null)

  const areaW = viewport.w
  const areaH = viewport.h - MENU_BAR_H - 78
  const posOf = (node: FSNode, i: number) => {
    if (dragPos?.id === node.id) return dragPos
    const p = positions[node.id]
    if (p) return { x: Math.min(Math.max(0, p.x), areaW - CELL_W), y: Math.min(Math.max(0, p.y), areaH - CELL_H) }
    return defaultSlot(i, areaW, areaH)
  }

  const onBackgroundDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.button !== 0) return
    focusDesktop()
    select(SURFACE, [])
    rootRef.current?.focus({ preventScroll: true })
    const r = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - r.left
    const sy = e.clientY - r.top
    const onMove = (ev: PointerEvent) => {
      const x = Math.min(sx, ev.clientX - r.left)
      const y = Math.min(sy, ev.clientY - r.top)
      const w = Math.abs(ev.clientX - r.left - sx)
      const h = Math.abs(ev.clientY - r.top - sy)
      setMarquee({ x, y, w, h })
      const hit = items
        .filter((n, i) => {
          const p = posOf(n, i)
          return p.x < x + w && p.x + CELL_W > x && p.y < y + h && p.y + CELL_H > y
        })
        .map((n) => n.id)
      select(SURFACE, hit)
    }
    const onUp = () => {
      setMarquee(null)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onIconDown = (node: FSNode, i: number) => (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    focusDesktop()
    const additive = e.metaKey || e.ctrlKey || e.shiftKey
    if (additive) {
      select(SURFACE, selection.includes(node.id) ? selection.filter((s) => s !== node.id) : [...selection, node.id])
      return
    }
    if (!selection.includes(node.id)) select(SURFACE, [node.id])
    const start = posOf(node, i)
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    let last = start
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      if (!moved && Math.hypot(dx, dy) < 4) return
      moved = true
      last = {
        x: Math.min(Math.max(0, start.x + dx), areaW - CELL_W),
        y: Math.min(Math.max(0, start.y + dy), areaH - CELL_H),
      }
      setDragPos({ id: node.id, ...last })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (moved) setIconPosition(node.id, last)
      setDragPos(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((n) => n.id === selection[selection.length - 1])
    const sel = items[idx]
    if (e.key === ' ' && sel) {
      e.preventDefault()
      useUi.getState().setQuickLook(sel.id)
    } else if ((e.key === 'Enter' || (e.metaKey && e.key === 'ArrowDown')) && sel) {
      e.preventDefault()
      selection.forEach((id) => openNode(id))
    } else if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault()
      const cur = idx < 0 ? -1 : idx
      const next = e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? cur + 1 : cur - 1
      const clamped = Math.max(0, Math.min(items.length - 1, idx < 0 ? 0 : next))
      select(SURFACE, [items[clamped]!.id])
    } else if (e.key === 'Escape') {
      select(SURFACE, [])
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      select(SURFACE, items.map((n) => n.id))
    }
  }

  const desktopMenu: MenuEntry[] = [
    { label: 'New Folder', disabled: true, hint: 'This Mac is read-only' },
    { type: 'separator' },
    { label: 'Get Info', disabled: true },
    { label: 'Change Wallpaper…', action: () => openApp('settings', { payload: { pane: 'wallpaper' } }) },
    { type: 'separator' },
    { label: 'Use Stacks', disabled: true, hint: 'Not available on this Mac' },
    { label: 'Clean Up', action: () => useSystem.getState().resetIconPositions() },
    { label: 'Show View Options', disabled: true },
  ]

  return (
    <div
      ref={rootRef}
      className="desktop-icons"
      role="grid"
      aria-label="Desktop"
      aria-multiselectable="true"
      tabIndex={0}
      onPointerDown={onBackgroundDown}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => {
        e.preventDefault()
        if (e.target === e.currentTarget) openContextMenu(e.clientX, e.clientY, desktopMenu, 'Desktop')
      }}
      data-testid="desktop"
    >
      <div role="row" className="contents">
        {items.map((node, i) => {
          const p = posOf(node, i)
          const selected = selection.includes(node.id)
          return (
            <div
              key={node.id}
              role="gridcell"
              aria-selected={selected}
              aria-label={node.name}
              className={`desktop-icon ${selected ? 'is-selected' : ''}`}
              style={{ left: p.x, top: p.y, zIndex: dragPos?.id === node.id ? 2 : 1 }}
              onPointerDown={onIconDown(node, i)}
              onDoubleClick={(e) => openNode(node.id, originOf(e.currentTarget))}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                select(SURFACE, [node.id])
                openContextMenu(e.clientX, e.clientY, fileMenu(node, { x: e.clientX, y: e.clientY }), node.name)
              }}
              data-testid={`desktop-icon-${node.id}`}
            >
              <span className="icon-frame">
                <FileIcon node={node} size={60} />
              </span>
              <span className="label">{node.name}</span>
            </div>
          )
        })}
      </div>
      {marquee && <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
    </div>
  )
}
