// Imperative OS actions shared by the desktop, dock, Finder, Spotlight,
// Terminal and menus.
import { APPS, type AppId } from './apps-meta'
import { HOME_ID, TRASH_ID, isFolder } from './fs'
import { useWindows, type WindowPayload } from './stores/windows'
import { useUi } from './stores/ui'
import { vfs } from './vfs'

type Origin = { x: number; y: number } | undefined

export function originOf(el: Element | null | undefined): Origin {
  if (!el) return undefined
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

const defaultPayload: Partial<Record<AppId, WindowPayload>> = {
  finder: { nodeId: HOME_ID },
  trash: { nodeId: TRASH_ID },
}

/** Opens a new window for the app (or focuses it, for single-window apps). */
export function openApp(appId: AppId, opts: { origin?: Origin; payload?: WindowPayload; title?: string } = {}) {
  const payload = opts.payload ?? defaultPayload[appId]
  const node = payload?.nodeId ? vfs.byId.get(payload.nodeId) : undefined
  const title = opts.title ?? (appId === 'finder' && node ? (node.id === HOME_ID ? 'mohith' : node.name) : undefined)
  return useWindows.getState().open(appId, { payload, origin: opts.origin, title })
}

/**
 * Dock-style activation: brings a running app's most recent window forward
 * (restoring it if every window is minimized) or launches the app.
 */
export function activateApp(appId: AppId, origin?: Origin) {
  const { windows, focus } = useWindows.getState()
  const mine = windows.filter((w) => w.appId === appId)
  if (mine.length === 0) return openApp(appId, { origin })
  const visible = mine.filter((w) => w.state !== 'minimized')
  const pick = (visible.length ? visible : mine).reduce((a, b) => (b.z > a.z ? b : a))
  focus(pick.id)
  return pick.id
}

/** Opens a filesystem node with the right app. */
export function openNode(nodeId: string, origin?: Origin) {
  const node = vfs.byId.get(nodeId)
  if (!node) return
  if (isFolder(node)) {
    if (node.id === TRASH_ID) return openApp('trash', { origin })
    return openApp('finder', { origin, payload: { nodeId }, title: node.name })
  }
  switch (node.kind) {
    case 'app-shortcut':
      return activateApp(node.opensWith, origin)
    case 'link':
      window.open(node.source, '_blank', 'noopener,noreferrer')
      return
    default:
      return openApp(node.opensWith, { origin, payload: { nodeId }, title: node.name })
  }
}

export function openNote(slug: string) {
  return openApp('notes', { payload: { noteSlug: slug } })
}

export function openCompose(subject?: string) {
  return openApp('mail', { payload: subject ? { subject } : undefined })
}

export function showAbout(appId: AppId) {
  useUi.getState().showSheet({
    title: APPS[appId].name,
    body: `Part of Mohith D K's portfolio. A browser recreation of a Mac, not affiliated with Apple Inc.`,
  })
}

export function openSimpleVersion() {
  // A full navigation on purpose: /simple should load without the shell's JS.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign('/simple')
}
