// Menu bar model. Every item either does something or is disabled; nothing is dead.
// Shortcut labels show the real macOS keys; the working browser-safe bindings
// live in src/shells/macos/Shortcuts.tsx and Help → Keyboard Shortcuts.
import { APPS, menuAppOf, type AppId } from './apps-meta'
import { BOOT_FLAG } from './keys'
import { activateApp, openApp, openCompose, openNode, openSimpleVersion, showAbout } from './actions'
import { canBack, canForward, currentOf, DESKTOP_ID, HOME_ID } from './fs'
import { useFs } from './stores/fs'
import { useUi, type MenuEntry } from './stores/ui'
import { useWindows, type Win } from './stores/windows'
import { vfs } from './vfs'

export type MenuDef = { id: string; label: string; items: MenuEntry[] }

const sep: MenuEntry = { type: 'separator' }

export function restart() {
  try {
    window.sessionStorage.removeItem(BOOT_FLAG)
  } catch {
    /* ignore */
  }
  window.location.reload()
}

export function monogramMenu(): MenuEntry[] {
  return [
    { label: 'About This Mac', action: () => openApp('about') },
    sep,
    { label: 'System Settings…', action: () => openApp('settings') },
    sep,
    { label: 'Open Simple Version', action: openSimpleVersion },
    sep,
    { label: 'Restart…', action: restart },
  ]
}

function windowMenu(appId: AppId, win?: Win): MenuEntry[] {
  const ws = useWindows.getState()
  const mine = ws.windows.filter((w) => menuAppOf(w.appId) === appId)
  return [
    { label: 'Minimize', shortcut: '⌘M', disabled: !win, action: () => win && ws.minimize(win.id) },
    { label: 'Zoom', disabled: !win, action: () => win && ws.toggleZoom(win.id) },
    { label: 'Move Window to Left Side of Screen', disabled: !win, action: () => win && ws.tile(win.id, 'left') },
    { label: 'Move Window to Right Side of Screen', disabled: !win, action: () => win && ws.tile(win.id, 'right') },
    sep,
    {
      label: 'Bring All to Front',
      disabled: mine.length === 0,
      action: () => mine.sort((a, b) => a.z - b.z).forEach((w) => ws.focus(w.id)),
    },
    ...(mine.length ? [sep] : []),
    ...mine.map((w) => ({ label: w.title, checked: w.id === win?.id, action: () => ws.focus(w.id) })),
  ]
}

function helpMenu(appId: AppId): MenuEntry[] {
  return [
    { label: `${APPS[appId].name} Help`, action: () => openNode('doc-shortcuts') },
    { label: 'Keyboard Shortcuts', action: () => openNode('doc-shortcuts') },
    sep,
    { label: 'Open Simple Version', action: openSimpleVersion },
    { label: 'Contact Mohith…', action: () => openCompose() },
  ]
}

const editMenu: MenuEntry[] = [
  { label: 'Undo', shortcut: '⌘Z', disabled: true },
  { label: 'Redo', shortcut: '⇧⌘Z', disabled: true },
  sep,
  { label: 'Cut', shortcut: '⌘X', disabled: true },
  { label: 'Copy', shortcut: '⌘C', disabled: true, hint: 'Use your browser copy shortcut' },
  { label: 'Paste', shortcut: '⌘V', disabled: true },
  { label: 'Select All', shortcut: '⌘A', disabled: true },
]

function finderMenus(win?: Win): MenuDef[] {
  const ws = useWindows.getState()
  const fs = useFs.getState()
  const h = win ? fs.history[win.id] : undefined
  const view = (win?.payload?.view as string | undefined) ?? 'icons'
  const current = h ? currentOf(h) : undefined
  const parent = current ? vfs.parent.get(current) : undefined
  const goTo = (id: string) => {
    if (win?.appId === 'finder') fs.go(win.id, id)
    else openNode(id)
  }
  return [
    {
      id: 'file',
      label: 'File',
      items: [
        { label: 'New Finder Window', shortcut: '⌘N', action: () => openApp('finder') },
        { label: 'New Folder', shortcut: '⇧⌘N', disabled: true },
        sep,
        { label: 'Close Window', shortcut: '⌘W', disabled: !win, action: () => win && ws.close(win.id) },
      ],
    },
    { id: 'edit', label: 'Edit', items: editMenu },
    {
      id: 'view',
      label: 'View',
      items: [
        {
          label: 'as Icons',
          shortcut: '⌘1',
          checked: view === 'icons',
          disabled: win?.appId !== 'finder',
          action: () => win && ws.setPayload(win.id, { view: 'icons' }),
        },
        {
          label: 'as List',
          shortcut: '⌘2',
          checked: view === 'list',
          disabled: win?.appId !== 'finder',
          action: () => win && ws.setPayload(win.id, { view: 'list' }),
        },
      ],
    },
    {
      id: 'go',
      label: 'Go',
      items: [
        { label: 'Back', shortcut: '⌘[', disabled: !h || !canBack(h), action: () => win && fs.goBack(win.id) },
        { label: 'Forward', shortcut: '⌘]', disabled: !h || !canForward(h), action: () => win && fs.goForward(win.id) },
        {
          label: 'Enclosing Folder',
          shortcut: '⌘↑',
          disabled: !parent || win?.appId !== 'finder',
          action: () => parent && goTo(parent),
        },
        sep,
        { label: 'Desktop', shortcut: '⇧⌘D', action: () => goTo(DESKTOP_ID) },
        { label: 'Home', shortcut: '⇧⌘H', action: () => goTo(HOME_ID) },
        { label: 'Projects', action: () => goTo('projects') },
        { label: 'Experience', action: () => goTo('experience') },
        { label: 'Documents', shortcut: '⇧⌘O', action: () => goTo('documents') },
        { label: 'Downloads', shortcut: '⌥⌘L', action: () => goTo('downloads') },
        { label: 'Applications', shortcut: '⇧⌘A', action: () => goTo('applications') },
      ],
    },
  ]
}

function genericFileMenu(appId: AppId, win?: Win): MenuDef {
  const ws = useWindows.getState()
  const node = win?.payload?.nodeId ? vfs.byId.get(win.payload.nodeId) : undefined
  const items: MenuEntry[] = [
    { label: 'New Window', shortcut: '⌘N', disabled: APPS[appId].singleton, action: () => openApp(appId) },
    { label: 'Open…', shortcut: '⌘O', action: () => openApp('finder') },
    sep,
    { label: 'Close Window', shortcut: '⌘W', disabled: !win, action: () => win && ws.close(win.id) },
  ]
  if (node?.type === 'file' && (node.kind === 'pdf' || node.kind === 'image')) {
    items.push(sep, {
      label: 'Download',
      action: () => {
        const a = document.createElement('a')
        a.href = node.source.replace(/^public\//, '/')
        a.download = node.name
        a.click()
      },
    })
  }
  return { id: 'file', label: 'File', items }
}

function previewView(win?: Win): MenuDef {
  const ws = useWindows.getState()
  const zoom = (win?.payload?.zoom as number | undefined) ?? 1
  const set = (z: number) => win && ws.setPayload(win.id, { zoom: Math.min(3, Math.max(0.5, z)) })
  return {
    id: 'view',
    label: 'View',
    items: [
      {
        label: 'Thumbnails',
        checked: win?.payload?.thumbnails !== false,
        disabled: !win,
        action: () => win && ws.setPayload(win.id, { thumbnails: win.payload?.thumbnails === false }),
      },
      sep,
      { label: 'Actual Size', shortcut: '⌘0', disabled: !win, action: () => set(1) },
      { label: 'Zoom In', shortcut: '⌘+', disabled: !win, action: () => set(zoom + 0.25) },
      { label: 'Zoom Out', shortcut: '⌘−', disabled: !win, action: () => set(zoom - 0.25) },
    ],
  }
}

function appSpecific(appId: AppId, win?: Win): MenuDef[] {
  switch (appId) {
    case 'finder':
      return finderMenus(win)
    case 'preview':
      return [genericFileMenu(appId, win), { id: 'edit', label: 'Edit', items: editMenu }, previewView(win)]
    case 'terminal':
      return [
        genericFileMenu(appId, win),
        { id: 'edit', label: 'Edit', items: editMenu },
        {
          id: 'shell',
          label: 'Shell',
          items: [{ label: 'Clear Screen', shortcut: '⌘K', disabled: !win, action: () => window.dispatchEvent(new CustomEvent('terminal:clear')) }],
        },
      ]
    case 'mail':
      return [
        {
          id: 'file',
          label: 'File',
          items: [
            { label: 'New Message', shortcut: '⌘N', action: () => openCompose() },
            sep,
            { label: 'Close Window', shortcut: '⌘W', disabled: !win, action: () => win && useWindows.getState().close(win.id) },
          ],
        },
        { id: 'edit', label: 'Edit', items: editMenu },
      ]
    default:
      return [genericFileMenu(appId, win), { id: 'edit', label: 'Edit', items: editMenu }]
  }
}

/** Menus for the app shown in the menu bar, after the bold app-name menu. */
export function buildMenus(activeApp: AppId, win?: Win): MenuDef[] {
  const appId = menuAppOf(activeApp)
  const name = APPS[appId].name
  const ws = useWindows.getState()
  const appMenu: MenuDef = {
    id: 'app',
    label: name,
    items: [
      { label: `About ${name}`, action: () => (appId === 'about' ? openApp('about') : showAbout(appId)) },
      sep,
      { label: 'Settings…', shortcut: '⌘,', action: () => openApp('settings') },
      sep,
      {
        label: `Hide ${name}`,
        shortcut: '⌘H',
        disabled: !ws.windows.some((w) => menuAppOf(w.appId) === appId),
        action: () => ws.windows.filter((w) => menuAppOf(w.appId) === appId).forEach((w) => ws.minimize(w.id)),
      },
      {
        label: `Quit ${name}`,
        shortcut: '⌘Q',
        disabled: appId === 'finder' && !ws.windows.some((w) => w.appId === 'finder'),
        action: () => {
          ws.quitApp(appId)
          if (appId === 'finder') ws.quitApp('trash')
        },
      },
    ],
  }
  return [
    appMenu,
    ...appSpecific(appId, win),
    { id: 'window', label: 'Window', items: windowMenu(appId, win) },
    { id: 'help', label: 'Help', items: helpMenu(appId) },
  ]
}

export const dockMenu = (appId: AppId, running: boolean): MenuEntry[] => {
  const ws = useWindows.getState()
  const mine = ws.windows.filter((w) => w.appId === appId)
  return [
    ...mine.map((w) => ({ label: w.title, action: () => ws.focus(w.id) })),
    ...(mine.length ? [sep] : []),
    { label: running ? 'Show' : 'Open', action: () => activateApp(appId) },
    { label: 'Show in Finder', action: () => openNode('applications') },
    sep,
    { label: 'Quit', disabled: !running, action: () => ws.quitApp(appId) },
  ]
}

export const closeMenus = () => useUi.getState().closeContextMenu()
