'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search } from 'lucide-react'
import { activateApp, openNode, openNote } from '@/os/actions'
import { useReducedMotion } from '@/os/hooks'
import { buildIndex, search, snippet, type SearchHit } from '@/os/search'
import { useUi } from '@/os/stores/ui'
import { vfs } from '@/os/vfs'

export function runHit(hit: SearchHit) {
  const t = hit.target
  if ('appId' in t) activateApp(t.appId)
  else if ('nodeId' in t) openNode(t.nodeId)
  else openNote(t.noteSlug)
}

function SpotlightPanel({ onClose }: { onClose: () => void }) {
  const index = useMemo(() => buildIndex(vfs), [])
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => search(index, q, 14), [index, q])

  // Top hit first, then the rest grouped by category (in order of best score).
  const ordered = useMemo(() => {
    if (hits.length === 0) return [] as Array<{ cat: string; hit: SearchHit }>
    const [top, ...rest] = hits
    const groups = new Map<string, SearchHit[]>()
    for (const h of rest) groups.set(h.category, [...(groups.get(h.category) ?? []), h])
    return [{ cat: 'Top Hit', hit: top! }, ...[...groups.entries()].flatMap(([cat, hs]) => hs.map((hit) => ({ cat, hit })))]
  }, [hits])

  useEffect(() => inputRef.current?.focus(), [])
  const selected = ordered[Math.min(active, ordered.length - 1)]?.hit

  const go = (hit?: SearchHit) => {
    if (!hit) return
    onClose()
    runHit(hit)
  }

  return (
    <div
      className="spotlight glass"
      role="dialog"
      aria-label="Spotlight"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActive((a) => Math.min(ordered.length - 1, a + 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActive((a) => Math.max(0, a - 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          go(selected)
        }
      }}
    >
      <div className="spotlight-input">
        <Search size={22} className="text-secondary" aria-hidden="true" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
          }}
          placeholder="Spotlight Search"
          aria-label="Spotlight Search"
          role="combobox"
          aria-expanded={ordered.length > 0}
          aria-controls="spotlight-results"
          aria-activedescendant={selected ? `sp-${selected.key}` : undefined}
          spellCheck={false}
          autoComplete="off"
          data-testid="spotlight-input"
        />
      </div>
      {ordered.length > 0 && (
        <div className="spotlight-results">
          <div className="spotlight-list" role="listbox" id="spotlight-results" aria-label="Results">
            {ordered.map(({ cat, hit }, i) => (
              <div key={hit.key} role="presentation">
                {(i === 0 || ordered[i - 1]!.cat !== cat) && <div className="spotlight-cat">{cat}</div>}
                <div
                  id={`sp-${hit.key}`}
                  role="option"
                  aria-selected={i === active}
                  className="spotlight-row"
                  onPointerMove={() => setActive(i)}
                  onClick={() => go(hit)}
                >
                  <img src={hit.icon} alt="" />
                  <span>{hit.title}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="spotlight-preview" aria-live="polite">
            {selected && (
              <>
                <img src={selected.icon} alt="" />
                <h3>{selected.title}</h3>
                <p>{selected.subtitle}</p>
                {selected.body && <p className="text-left">{snippet(selected.body, q)}</p>}
              </>
            )}
          </div>
        </div>
      )}
      {q.trim() && ordered.length === 0 && <p className="px-5 pb-4 text-secondary">No results for “{q}”.</p>}
    </div>
  )
}

export function Spotlight() {
  const open = useUi((s) => s.spotlightOpen)
  const setSpotlight = useUi((s) => s.setSpotlight)
  const reduced = useReducedMotion()
  const close = () => setSpotlight(false)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="spotlight-backdrop"
          onPointerDown={(e) => e.target === e.currentTarget && close()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.14 }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto"
            initial={reduced ? false : { scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
            <SpotlightPanel onClose={close} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
