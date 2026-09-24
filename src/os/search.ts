// Spotlight index and fuzzy scorer over apps, files, projects, experience and notes.
import { documents, experience, notes, plainText, projects } from '@/content'
import { APPS, type AppId } from './apps-meta'
import { displayPath, iconFor, isHidden, type FSIndex } from './fs'

export type SearchCategory = 'Applications' | 'Projects' | 'Experience' | 'Notes' | 'Documents' | 'Folders'

export type SearchItem = {
  key: string
  title: string
  subtitle: string
  category: SearchCategory
  icon: string
  /** Lower-cased body text used for content matches and the preview snippet. */
  body: string
  target: { appId: AppId } | { nodeId: string } | { noteSlug: string }
}

export type SearchHit = SearchItem & { score: number }

export function buildIndex(ix: FSIndex): SearchItem[] {
  const items: SearchItem[] = []
  for (const app of Object.values(APPS)) {
    items.push({
      key: `app:${app.id}`,
      title: app.name,
      subtitle: 'Application',
      category: 'Applications',
      icon: app.icon,
      body: '',
      target: { appId: app.id },
    })
  }
  for (const p of projects) {
    const node = [...ix.byId.values()].find((n) => n.id === `project-${p.slug}`)
    if (!node) continue
    items.push({
      key: `project:${p.slug}`,
      title: p.name,
      subtitle: p.summary,
      category: 'Projects',
      icon: '/icons/folder-projects.svg',
      body: plainText(documents[`content/projects/${p.slug}.mdx`] ?? '') + ' ' + p.tags.join(' '),
      target: { nodeId: `project-${p.slug}-readme` },
    })
  }
  for (const e of experience) {
    items.push({
      key: `experience:${e.slug}`,
      title: `${e.role} — ${e.company}`,
      subtitle: e.summary,
      category: 'Experience',
      icon: '/icons/folder-experience.svg',
      body: plainText(documents[`content/experience/${e.slug}.mdx`] ?? '') + ' ' + e.tags.join(' '),
      target: { nodeId: `experience-${e.slug}-role` },
    })
  }
  for (const n of notes) {
    items.push({
      key: `note:${n.slug}`,
      title: n.title,
      subtitle: `Notes — ${n.folder}`,
      category: 'Notes',
      icon: '/icons/notes.svg',
      body: plainText(documents[`content/notes/${n.slug}.mdx`] ?? ''),
      target: { noteSlug: n.slug },
    })
  }
  for (const node of ix.byId.values()) {
    if (isHidden(node) || node.id === 'root') continue
    if (node.type === 'file' && node.kind === 'app-shortcut') continue
    // Project READMEs and role files are already covered above.
    if (node.id.startsWith('project-') || node.id.startsWith('experience-')) continue
    items.push({
      key: `node:${node.id}`,
      title: node.name,
      subtitle: displayPath(ix, node.id),
      category: node.type === 'folder' ? 'Folders' : 'Documents',
      icon: iconFor(node),
      body: node.type === 'file' && node.kind === 'md' ? plainText(documents[node.source] ?? '') : '',
      target: { nodeId: node.id },
    })
  }
  return items.map((i) => ({ ...i, body: i.body.toLowerCase() }))
}

/** Scores `text` against `q`: prefix > word start > substring > subsequence. 0 = no match. */
export function fuzzyScore(q: string, text: string): number {
  const t = text.toLowerCase()
  const query = q.toLowerCase().trim()
  if (!query) return 0
  if (t === query) return 100
  if (t.startsWith(query)) return 90 - Math.min(20, t.length - query.length) / 2
  const idx = t.indexOf(query)
  if (idx >= 0) return (/[\s\-—_./(]/.test(t[idx - 1] ?? ' ') ? 75 : 60) - Math.min(15, idx / 4)
  // subsequence with gap penalty
  let ti = 0
  let gaps = 0
  let last = -1
  for (const ch of query) {
    if (ch === ' ') continue
    const found = t.indexOf(ch, ti)
    if (found < 0) return 0
    if (last >= 0) gaps += found - last - 1
    last = found
    ti = found + 1
  }
  return Math.max(1, 40 - gaps * 1.5)
}

const CATEGORY_BOOST: Record<SearchCategory, number> = {
  Applications: 4,
  Projects: 6,
  Experience: 5,
  Notes: 2,
  Documents: 3,
  Folders: 1,
}

export function search(items: SearchItem[], q: string, limit = 12): SearchHit[] {
  const query = q.trim()
  if (!query) return []
  const hits: SearchHit[] = []
  for (const item of items) {
    let score = fuzzyScore(query, item.title)
    if (score === 0 && query.length >= 3 && item.body.includes(query.toLowerCase())) score = 30
    if (score === 0) continue
    hits.push({ ...item, score: score + CATEGORY_BOOST[item.category] })
  }
  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit)
}

/** A short excerpt around the first occurrence of `q` in `body`. */
export function snippet(body: string, q: string, radius = 80): string {
  const i = body.indexOf(q.toLowerCase().trim())
  if (i < 0) return body.slice(0, radius * 2)
  const start = Math.max(0, i - radius)
  return (start > 0 ? '…' : '') + body.slice(start, i + radius) + '…'
}
