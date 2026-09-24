'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, RotateCw } from 'lucide-react'
import { Toolbar } from '@/ui/Toolbar'
import { bookmarkSections } from './bookmarks'

export default function Safari() {
  const [hovered, setHovered] = useState<string | null>(null)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const sections = bookmarkSections(origin)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar inset>
        <button className="tb-btn" aria-label="Back" disabled>
          <ChevronLeft size={18} />
        </button>
        <button className="tb-btn" aria-label="Forward" disabled>
          <ChevronRight size={18} />
        </button>
        <div className="safari-address" aria-live="polite" data-testid="safari-address">
          {hovered ? (
            <>
              <Lock size={11} aria-hidden="true" /> {hovered}
            </>
          ) : (
            <span className="text-secondary">Start Page — search or pick a favorite</span>
          )}
        </div>
        <button className="tb-btn" aria-label="Reload" disabled>
          <RotateCw size={14} />
        </button>
      </Toolbar>
      <div className="safari-start">
        {sections
          .filter((s) => s.items.length)
          .map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <ul>
                {s.items.map((b) => (
                  <li key={b.title}>
                    {b.url ? (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="safari-tile"
                        onPointerEnter={() => setHovered(b.url)}
                        onPointerLeave={() => setHovered(null)}
                        onFocus={() => setHovered(b.url)}
                        onBlur={() => setHovered(null)}
                      >
                        <span className="safari-tile-icon" style={{ background: b.color }}>
                          {b.initial}
                        </span>
                        <span className="safari-tile-title">{b.title}</span>
                      </a>
                    ) : (
                      <span className="safari-tile is-disabled" title={b.subtitle}>
                        <span className="safari-tile-icon" style={{ background: b.color }}>
                          {b.initial}
                        </span>
                        <span className="safari-tile-title">{b.title}</span>
                        <span className="safari-tile-todo">{b.subtitle}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        <p className="safari-note">Most sites can’t be embedded in a page, so favorites open in a new browser tab.</p>
      </div>
    </div>
  )
}
