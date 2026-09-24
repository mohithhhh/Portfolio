'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AppWindow,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleArrowDown,
  FileText,
  FolderCode,
  HardDrive,
  House,
  LayoutGrid,
  List,
  Monitor,
  Search,
} from 'lucide-react'
import type { FSNode } from '@/content/schema'
import { openNode, originOf } from '@/os/actions'
import { ancestry, DESKTOP_ID, HOME_ID, kindLabel, latestModified, ROOT_ID, type SortKey } from '@/os/fs'
import { useFs } from '@/os/stores/fs'
import { useUi } from '@/os/stores/ui'
import { useWindows } from '@/os/stores/windows'
import type { AppProps } from '@/os/registry'
import { vfs } from '@/os/vfs'
import { FileIcon } from '@/ui/FileIcon'
import { SidebarItem, Toolbar } from '@/ui/Toolbar'
import { fileMenu } from '@/shells/macos/Desktop'
import { formatDate, useFinderLocation, useFolderItems } from './useFinder'

const FAVORITES = [
  { id: DESKTOP_ID, label: 'Desktop', icon: Monitor },
  { id: 'projects', label: 'Projects', icon: FolderCode },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'downloads', label: 'Downloads', icon: CircleArrowDown },
  { id: 'applications', label: 'Applications', icon: AppWindow },
  { id: HOME_ID, label: 'mohith', icon: House },
]

const CELL = 100

type Props = AppProps & {
  /** Trash pins the window to one folder. */
  fixedFolder?: string
  toolbarExtra?: ReactNode
  emptyState?: ReactNode
  hideItems?: boolean
}

export function FinderView({ win, focused, fixedFolder, toolbarExtra, emptyState, hideItems }: Props) {
  const initial = fixedFolder ?? win.payload?.nodeId ?? HOME_ID
  const loc = useFinderLocation(win.id, initial)
  const view = (win.payload?.view as 'icons' | 'list' | undefined) ?? 'icons'
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' })
  const items = useFolderItems(loc.folderId, query, sort.key, sort.dir)
  const shown = hideItems ? [] : items
  const selection = useFs((s) => s.selection[win.id]) ?? []
  const select = useFs((s) => s.select)
  const setTitle = useWindows((s) => s.setTitle)
  const setPayload = useWindows((s) => s.setPayload)
  const openContextMenu = useUi((s) => s.openContextMenu)
  const contentRef = useRef<HTMLDivElement>(null)

  const title = query ? `Searching “${query}”` : loc.folderId === HOME_ID ? 'mohith' : (loc.folder?.name ?? 'Finder')
  useEffect(() => {
    if (!fixedFolder) setTitle(win.id, loc.folderId === HOME_ID ? 'mohith' : (loc.folder?.name ?? 'Finder'))
  }, [fixedFolder, loc.folderId, loc.folder?.name, setTitle, win.id])

  const open = (n: FSNode, el?: Element | null) => {
    if (n.type === 'folder' && n.id !== 'trash') {
      setQuery('')
      loc.go(n.id)
      contentRef.current?.focus({ preventScroll: true })
    } else openNode(n.id, originOf(el))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = shown.findIndex((n) => n.id === selection[selection.length - 1])
    const cur = shown[idx]
    const cols = view === 'icons' ? Math.max(1, Math.floor((contentRef.current?.clientWidth ?? CELL) / CELL)) : 1
    const moveTo = (i: number) => {
      const n = shown[Math.max(0, Math.min(shown.length - 1, i))]
      if (n) {
        select(win.id, [n.id])
        contentRef.current?.querySelector(`[data-node="${n.id}"]`)?.scrollIntoView({ block: 'nearest' })
      }
    }
    if (e.key === 'ArrowRight' && view === 'icons') moveTo(idx < 0 ? 0 : idx + 1)
    else if (e.key === 'ArrowLeft' && view === 'icons') moveTo(idx < 0 ? 0 : idx - 1)
    else if (e.key === 'ArrowDown' && (e.metaKey || e.ctrlKey)) {
      if (cur) open(cur)
    }
    else if (e.key === 'ArrowUp' && (e.metaKey || e.ctrlKey)) {
      const p = vfs.parent.get(loc.folderId)
      if (p && !fixedFolder) loc.go(p)
    } else if (e.key === 'ArrowDown') moveTo(idx < 0 ? 0 : idx + cols)
    else if (e.key === 'ArrowUp') moveTo(idx < 0 ? 0 : idx - cols)
    else if (e.key === 'Enter') {
      if (cur) open(cur)
    }
    else if (e.key === 'Backspace' && !fixedFolder) {
      const p = vfs.parent.get(loc.folderId)
      if (p) loc.go(p)
    } else if (e.key === ' ') {
      if (cur) useUi.getState().setQuickLook(cur.id)
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') select(win.id, shown.map((n) => n.id))
    else if (e.key === 'Escape') select(win.id, [])
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  const onItemClick = (n: FSNode) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) select(win.id, selection.includes(n.id) ? selection.filter((s) => s !== n.id) : [...selection, n.id])
    else select(win.id, [n.id])
  }
  const onItemMenu = (n: FSNode) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    select(win.id, [n.id])
    openContextMenu(e.clientX, e.clientY, fileMenu(n), n.name)
  }

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const path = ancestry(vfs, loc.folderId)

  return (
    <div className="flex h-full min-h-0">
      <aside className="sidebar glass" aria-label="Sidebar">
        <div className="sidebar-heading">Favorites</div>
        {FAVORITES.map((f) => (
          <SidebarItem
            key={f.id}
            icon={<f.icon size={16} />}
            label={f.label}
            current={!query && loc.folderId === f.id && !fixedFolder}
            onClick={() => {
              setQuery('')
              if (fixedFolder) openNode(f.id)
              else loc.go(f.id)
            }}
            testId={`finder-sidebar-${f.id}`}
          />
        ))}
        <div className="sidebar-heading">Locations</div>
        <SidebarItem
          icon={<HardDrive size={16} />}
          label="Macintosh HD"
          current={loc.folderId === ROOT_ID}
          onClick={() => (fixedFolder ? openNode(ROOT_ID) : loc.go(ROOT_ID))}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-window">
        <Toolbar>
          <div className="flex items-center" data-no-drag>
            <button className="tb-btn" aria-label="Back" disabled={!loc.canBack || !!fixedFolder} onClick={loc.back}>
              <ChevronLeft size={18} />
            </button>
            <button className="tb-btn" aria-label="Forward" disabled={!loc.canForward || !!fixedFolder} onClick={loc.forward}>
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className="toolbar-title m-0" data-testid="finder-title">
            {fixedFolder ? 'Trash' : title}
          </h2>
          <div className="toolbar-spacer" />
          {toolbarExtra}
          <div className="tb-group" role="group" aria-label="View">
            <button className="tb-btn" aria-label="as Icons" aria-pressed={view === 'icons'} onClick={() => setPayload(win.id, { view: 'icons' })}>
              <LayoutGrid size={15} />
            </button>
            <button className="tb-btn" aria-label="as List" aria-pressed={view === 'list'} onClick={() => setPayload(win.id, { view: 'list' })}>
              <List size={16} />
            </button>
          </div>
          {!fixedFolder && (
            <label className="tb-search">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                aria-label="Search files"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              />
            </label>
          )}
        </Toolbar>

        <div
          ref={contentRef}
          className="finder-content"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => e.target === e.currentTarget && select(win.id, [])}
          data-testid="finder-content"
          aria-label={`${title} contents`}
        >
          {shown.length === 0 && (emptyState ?? <p className="finder-empty">{query ? 'No results' : 'This folder is empty.'}</p>)}
          {shown.length > 0 && view === 'icons' && (
            <div role="grid" aria-label={title} aria-multiselectable="true" className="finder-grid">
              <div role="row" className="contents">
                {shown.map((n) => (
                  <div
                    key={n.id}
                    role="gridcell"
                    aria-selected={selection.includes(n.id)}
                    className={`finder-item ${selection.includes(n.id) ? 'is-selected' : ''} ${focused ? '' : 'is-inactive'}`}
                    data-node={n.id}
                    data-testid={`finder-item-${n.id}`}
                    onClick={onItemClick(n)}
                    onDoubleClick={(e) => open(n, e.currentTarget)}
                    onContextMenu={onItemMenu(n)}
                  >
                    <span className="icon-frame">
                      <FileIcon node={n} size={56} />
                    </span>
                    <span className="label">{n.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {shown.length > 0 && view === 'list' && (
            <table className="finder-list" role="grid" aria-label={title} aria-multiselectable="true">
              <thead>
                <tr>
                  {(
                    [
                      ['name', 'Name'],
                      ['modified', 'Date Modified'],
                      ['size', 'Size'],
                      ['kind', 'Kind'],
                    ] as Array<[SortKey, string]>
                  ).map(([key, label]) => (
                    <th key={key} aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button onClick={() => toggleSort(key)}>
                        {label}
                        {sort.key === key && <span aria-hidden="true">{sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((n) => (
                  <tr
                    key={n.id}
                    aria-selected={selection.includes(n.id)}
                    className={`${selection.includes(n.id) ? 'is-selected' : ''} ${focused ? '' : 'is-inactive'}`}
                    data-node={n.id}
                    data-testid={`finder-item-${n.id}`}
                    onClick={onItemClick(n)}
                    onDoubleClick={(e) => open(n, e.currentTarget)}
                    onContextMenu={onItemMenu(n)}
                  >
                    <td>
                      <span className="flex items-center gap-2">
                        <FileIcon node={n} size={18} />
                        <span className="truncate">{n.name}</span>
                      </span>
                    </td>
                    <td>{formatDate(latestModified(n))}</td>
                    <td>{n.type === 'file' ? (n.size ?? '--') : '--'}</td>
                    <td>{kindLabel(n)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <nav className="finder-pathbar" aria-label="Path">
          {path.map((n, i) => (
            <span key={n.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="text-tertiary" aria-hidden="true" />}
              <button onDoubleClick={() => !fixedFolder && loc.go(n.id)} onClick={() => !fixedFolder && loc.go(n.id)}>
                <FileIcon node={n} size={14} />
                {n.id === ROOT_ID ? 'Macintosh HD' : n.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="finder-status" aria-live="polite" data-testid="finder-status">
          {shown.length} {shown.length === 1 ? 'item' : 'items'}
          {selection.length > 0 && `, ${selection.length} selected`}
        </div>
      </div>
    </div>
  )
}
