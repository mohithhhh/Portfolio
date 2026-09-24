'use client'
import { useState } from 'react'
import { Folder, Pin, Search } from 'lucide-react'
import { MdxDocument } from '@/content/mdx'
import { notes } from '@/content'
import type { AppProps } from '@/os/registry'
import { useWindows } from '@/os/stores/windows'
import { SidebarItem, Toolbar } from '@/ui/Toolbar'
import { formatNoteDate, noteFolders, useNotesList } from './useNotes'

export default function Notes({ win, focused }: AppProps) {
  const [query, setQuery] = useState('')
  const [folder, setFolder] = useState<string | null>(null)
  const list = useNotesList(query, folder)
  const setPayload = useWindows((s) => s.setPayload)
  const requested = win.payload?.noteSlug as string | undefined
  const selectedSlug = requested && notes.some((n) => n.slug === requested) ? requested : (list[0]?.slug ?? notes[0]?.slug)
  const selected = notes.find((n) => n.slug === selectedSlug)
  const pinned = list.filter((n) => n.pinned)
  const others = list.filter((n) => !n.pinned)

  const row = (n: (typeof list)[number]) => (
    <li key={n.slug}>
      <button
        className={`notes-row ${n.slug === selectedSlug ? 'is-selected' : ''} ${focused ? '' : 'is-inactive'}`}
        aria-current={n.slug === selectedSlug || undefined}
        onClick={() => setPayload(win.id, { noteSlug: n.slug })}
      >
        <strong className="truncate">{n.title}</strong>
        <span className="truncate">
          <time>{formatNoteDate(n.modified)}</time> {n.preview}
        </span>
      </button>
    </li>
  )

  return (
    <div className="flex h-full min-h-0">
      <aside className="sidebar glass" aria-label="Folders">
        <div className="sidebar-heading">iCloud</div>
        <SidebarItem icon={<Folder size={16} />} label="All Notes" current={folder === null} onClick={() => setFolder(null)} />
        {noteFolders.map((f) => (
          <SidebarItem key={f} icon={<Folder size={16} />} label={f} current={folder === f} onClick={() => setFolder(f)} />
        ))}
      </aside>
      <div className="notes-list-pane">
        <Toolbar>
          <h2 className="toolbar-title m-0">{folder ?? 'All Notes'}</h2>
          <span className="text-[11px] text-secondary">{list.length} notes</span>
        </Toolbar>
        <div className="flex-1 overflow-y-auto p-2">
          {pinned.length > 0 && (
            <>
              <h3 className="notes-section">
                <Pin size={11} aria-hidden="true" /> Pinned
              </h3>
              <ul className="m-0 list-none p-0">{pinned.map(row)}</ul>
            </>
          )}
          {others.length > 0 && (
            <>
              <h3 className="notes-section">Notes</h3>
              <ul className="m-0 list-none p-0">{others.map(row)}</ul>
            </>
          )}
          {list.length === 0 && <p className="p-4 text-center text-secondary">No matching notes.</p>}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-window">
        <Toolbar>
          <div className="toolbar-spacer" />
          <label className="tb-search">
            <Search size={14} aria-hidden="true" />
            <input type="search" placeholder="Search" aria-label="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </Toolbar>
        <div className="notes-body selectable" data-testid="notes-body">
          {selected && (
            <>
              <p className="notes-date">{formatNoteDate(selected.modified)}</p>
              <MdxDocument source={`content/notes/${selected.slug}.mdx`} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
