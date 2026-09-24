// Pure helpers over the virtual filesystem tree (content/filesystem.json).
import type { FSFile, FSFolder, FSNode } from '@/content/schema'

export const ROOT_ID = 'root'
export const HOME_ID = 'home'
export const DESKTOP_ID = 'desktop'
export const TRASH_ID = 'trash'
export const HOME_PATH = '/Users/mohith'

export type FSIndex = {
  root: FSFolder
  byId: Map<string, FSNode>
  parent: Map<string, string>
}

export function indexTree(root: FSFolder): FSIndex {
  const byId = new Map<string, FSNode>()
  const parent = new Map<string, string>()
  const visit = (node: FSNode, parentId?: string) => {
    byId.set(node.id, node)
    if (parentId) parent.set(node.id, parentId)
    if (node.type === 'folder') for (const c of node.children) visit(c, node.id)
  }
  visit(root)
  return { root, byId, parent }
}

export const isFolder = (n: FSNode | undefined): n is FSFolder => n?.type === 'folder'
export const isFile = (n: FSNode | undefined): n is FSFile => n?.type === 'file'
export const isHidden = (n: FSNode) => n.name.startsWith('.')

/** Nodes from the root down to (and including) `id`. */
export function ancestry(ix: FSIndex, id: string): FSNode[] {
  const out: FSNode[] = []
  let cur: string | undefined = id
  while (cur) {
    const node = ix.byId.get(cur)
    if (!node) break
    out.unshift(node)
    cur = ix.parent.get(cur)
  }
  return out
}

/** Absolute POSIX path, e.g. /Users/mohith/Desktop. The root is "/". */
export function pathOf(ix: FSIndex, id: string): string {
  const names = ancestry(ix, id)
    .slice(1)
    .map((n) => n.name)
  return '/' + names.join('/')
}

/** Path with the home directory collapsed to ~. */
export function displayPath(ix: FSIndex, id: string): string {
  const p = pathOf(ix, id)
  if (p === HOME_PATH) return '~'
  return p.startsWith(HOME_PATH + '/') ? '~' + p.slice(HOME_PATH.length) : p
}

export function childNamed(folder: FSFolder, name: string): FSNode | undefined {
  return folder.children.find((c) => c.name === name) ?? folder.children.find((c) => c.name.toLowerCase() === name.toLowerCase())
}

/** Resolves a shell-style path (absolute, ~, relative, with . and ..) from `cwdId`. */
export function resolvePath(ix: FSIndex, cwdId: string, input: string): FSNode | undefined {
  let path = input.trim()
  if (path === '') return ix.byId.get(cwdId)
  let cur: FSNode | undefined
  if (path === '~' || path.startsWith('~/')) {
    cur = ix.byId.get(HOME_ID)
    path = path.slice(1)
  } else if (path.startsWith('/')) {
    cur = ix.root
  } else {
    cur = ix.byId.get(cwdId)
  }
  for (const part of path.split('/')) {
    if (!cur) return undefined
    if (part === '' || part === '.') continue
    if (part === '..') {
      const p = ix.parent.get(cur.id)
      cur = p ? ix.byId.get(p) : cur
      continue
    }
    if (!isFolder(cur)) return undefined
    cur = childNamed(cur, part)
  }
  return cur
}

export function listChildren(ix: FSIndex, folderId: string, showHidden = false): FSNode[] {
  const f = ix.byId.get(folderId)
  if (!isFolder(f)) return []
  return f.children.filter((c) => showHidden || !isHidden(c))
}

export function kindLabel(n: FSNode): string {
  if (n.type === 'folder') return 'Folder'
  switch (n.kind) {
    case 'pdf':
      return 'PDF document'
    case 'md':
      return 'Markdown document'
    case 'image':
      return 'JPEG image'
    case 'video':
      return 'MPEG-4 movie'
    case 'link':
      return 'Web location'
    case 'app-shortcut':
      return 'Application'
  }
}

export type SortKey = 'name' | 'modified' | 'size' | 'kind'

const sizeBytes = (s?: string) => {
  if (!s) return -1
  const m = /([\d.]+)\s*(KB|MB|GB|B)/i.exec(s)
  if (!m) return -1
  const mult = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9 }[m[2]!.toUpperCase() as 'B' | 'KB' | 'MB' | 'GB']
  return Number(m[1]) * mult
}

export function latestModified(n: FSNode): string {
  if (n.type === 'file') return n.modified
  return n.children.reduce((acc, c) => {
    const m = latestModified(c)
    return m > acc ? m : acc
  }, '')
}

export function sortNodes(nodes: FSNode[], key: SortKey = 'name', dir: 'asc' | 'desc' = 'asc'): FSNode[] {
  const cmp = (a: FSNode, b: FSNode): number => {
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      case 'modified':
        return latestModified(a).localeCompare(latestModified(b))
      case 'size':
        return sizeBytes(a.type === 'file' ? a.size : undefined) - sizeBytes(b.type === 'file' ? b.size : undefined)
      case 'kind':
        return kindLabel(a).localeCompare(kindLabel(b))
    }
  }
  const sorted = [...nodes].sort((a, b) => cmp(a, b) || a.name.localeCompare(b.name))
  return dir === 'asc' ? sorted : sorted.reverse()
}

/** Tab completion: returns the completed input and any ambiguous candidates. */
export function completePath(ix: FSIndex, cwdId: string, partial: string): { completed: string; candidates: string[] } {
  const slash = partial.lastIndexOf('/')
  const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : ''
  const namePart = slash >= 0 ? partial.slice(slash + 1) : partial
  const dir = dirPart ? resolvePath(ix, cwdId, dirPart) : ix.byId.get(cwdId)
  if (!isFolder(dir)) return { completed: partial, candidates: [] }
  const matches = dir.children.filter(
    (c) => !isHidden(c) && c.name.toLowerCase().startsWith(namePart.toLowerCase()),
  )
  if (matches.length === 0) return { completed: partial, candidates: [] }
  const esc = (n: FSNode) => n.name.replace(/ /g, '\\ ') + (n.type === 'folder' ? '/' : '')
  if (matches.length === 1) return { completed: dirPart + esc(matches[0]!), candidates: [] }
  // longest common prefix
  let prefix = matches[0]!.name
  for (const m of matches) {
    while (!m.name.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1)
  }
  return {
    completed: dirPart + (prefix.length > namePart.length ? prefix.replace(/ /g, '\\ ') : namePart),
    candidates: matches.map((m) => m.name + (m.type === 'folder' ? '/' : '')),
  }
}

export function iconFor(n: FSNode): string {
  if (n.icon === 'trash') return '/icons/trash.svg'
  if (n.icon === 'drive') return '/icons/drive.svg'
  if (n.type === 'folder') {
    const special = n.icon ?? (n.id === 'certificates' ? 'certificates' : undefined)
    return special ? `/icons/folder-${special}.svg` : '/icons/folder.svg'
  }
  if (n.icon) return n.icon
  switch (n.kind) {
    case 'pdf':
      return '/icons/doc-pdf.svg'
    case 'md':
      return '/icons/doc-md.svg'
    case 'image':
      return '/icons/doc-image.svg'
    case 'video':
      return '/icons/doc-video.svg'
    case 'link':
      return '/icons/doc-link.svg'
    case 'app-shortcut':
      return `/icons/${n.opensWith}.svg`
  }
}

/** Public URL for a pdf/image/video source ("public/x.pdf" → "/x.pdf"). */
export const publicUrl = (source: string) => source.replace(/^public\//, '/')

// ---------- per-window navigation history ----------
export type NavHistory = { stack: string[]; index: number }
export const newHistory = (id: string): NavHistory => ({ stack: [id], index: 0 })
export const currentOf = (h: NavHistory) => h.stack[h.index]!
export function navigate(h: NavHistory, id: string): NavHistory {
  if (currentOf(h) === id) return h
  return { stack: [...h.stack.slice(0, h.index + 1), id], index: h.index + 1 }
}
export const canBack = (h: NavHistory) => h.index > 0
export const canForward = (h: NavHistory) => h.index < h.stack.length - 1
export const back = (h: NavHistory): NavHistory => (canBack(h) ? { ...h, index: h.index - 1 } : h)
export const forward = (h: NavHistory): NavHistory => (canForward(h) ? { ...h, index: h.index + 1 } : h)
