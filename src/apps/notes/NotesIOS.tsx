'use client'
import { Pin } from 'lucide-react'
import { useState } from 'react'
import { MdxDocument } from '@/content/mdx'
import { IOSNav } from '@/ui/IOSNav'
import { formatNoteDate, useNotesList } from './useNotes'

export default function NotesIOS() {
  const [slug, setSlug] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const list = useNotesList(query, null)
  if (slug) {
    return (
      <div className="ios-screen">
        <IOSNav title="" onBack={() => setSlug(null)} backLabel="Notes" />
        <div className="ios-doc selectable">
          <MdxDocument source={`content/notes/${slug}.mdx`} />
        </div>
      </div>
    )
  }
  return (
    <div className="ios-screen">
      <IOSNav title="Notes" large />
      <div className="px-4 pb-2">
        <input className="ios-search" type="search" placeholder="Search" aria-label="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ul className="ios-list">
        {list.map((n) => (
          <li key={n.slug}>
            <button className="ios-row is-note" onClick={() => setSlug(n.slug)}>
              <span className="ios-row-text">
                <strong>
                  {n.pinned && <Pin size={12} className="mr-1 inline" aria-label="Pinned" />}
                  {n.title}
                </strong>
                <small>
                  {formatNoteDate(n.modified)} · {n.preview}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
