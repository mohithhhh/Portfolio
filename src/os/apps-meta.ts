// Pure data about every app (no React). The client registry (registry.ts)
// adds components and menus on top of this; the window store and tests use
// this module directly.
import type { AppId } from '@/content/schema'

export type { AppId }

export type AppMeta = {
  id: AppId
  name: string
  icon: string
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
  singleton: boolean
  dockPinned: boolean
  /** File kinds this app can open ("Open With"). */
  fileTypes: Array<'pdf' | 'md' | 'image' | 'video' | 'link'>
  /** iOS home screen name/icon, when the app exists on iOS. */
  ios?: { name: string; icon: string }
}

export const APPS: Record<AppId, AppMeta> = {
  finder: {
    id: 'finder',
    name: 'Finder',
    icon: '/icons/finder.svg',
    defaultSize: { w: 820, h: 500 },
    minSize: { w: 480, h: 300 },
    singleton: false,
    dockPinned: true,
    fileTypes: [],
    ios: { name: 'Files', icon: '/icons/files.svg' },
  },
  preview: {
    id: 'preview',
    name: 'Preview',
    icon: '/icons/preview.svg',
    defaultSize: { w: 760, h: 720 },
    minSize: { w: 420, h: 360 },
    singleton: false,
    dockPinned: true,
    fileTypes: ['pdf', 'image'],
    ios: { name: 'Resume', icon: '/icons/resume.svg' },
  },
  textedit: {
    id: 'textedit',
    name: 'TextEdit',
    icon: '/icons/textedit.svg',
    defaultSize: { w: 680, h: 560 },
    minSize: { w: 360, h: 260 },
    singleton: false,
    dockPinned: false,
    fileTypes: ['md'],
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    icon: '/icons/notes.svg',
    defaultSize: { w: 900, h: 560 },
    minSize: { w: 560, h: 340 },
    singleton: true,
    dockPinned: true,
    fileTypes: [],
    ios: { name: 'Notes', icon: '/icons/notes.svg' },
  },
  mail: {
    id: 'mail',
    name: 'Mail',
    icon: '/icons/mail.svg',
    defaultSize: { w: 620, h: 560 },
    minSize: { w: 440, h: 380 },
    singleton: true,
    dockPinned: true,
    fileTypes: [],
    ios: { name: 'Mail', icon: '/icons/mail.svg' },
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    icon: '/icons/terminal.svg',
    defaultSize: { w: 760, h: 460 },
    minSize: { w: 380, h: 220 },
    singleton: true,
    dockPinned: true,
    fileTypes: [],
    ios: { name: 'Messages', icon: '/icons/messages.svg' },
  },
  safari: {
    id: 'safari',
    name: 'Safari',
    icon: '/icons/safari.svg',
    defaultSize: { w: 900, h: 600 },
    minSize: { w: 480, h: 340 },
    singleton: true,
    dockPinned: true,
    fileTypes: ['link'],
  },
  settings: {
    id: 'settings',
    name: 'System Settings',
    icon: '/icons/settings.svg',
    defaultSize: { w: 720, h: 520 },
    minSize: { w: 600, h: 400 },
    singleton: true,
    dockPinned: true,
    fileTypes: [],
    ios: { name: 'Settings', icon: '/icons/settings.svg' },
  },
  about: {
    id: 'about',
    name: 'About This Mac',
    icon: '/icons/about.svg',
    defaultSize: { w: 340, h: 660 },
    minSize: { w: 340, h: 660 },
    singleton: true,
    dockPinned: false,
    fileTypes: [],
    ios: { name: 'About', icon: '/icons/about.svg' },
  },
  'activity-monitor': {
    id: 'activity-monitor',
    name: 'Activity Monitor',
    icon: '/icons/activity-monitor.svg',
    defaultSize: { w: 640, h: 380 },
    minSize: { w: 480, h: 260 },
    singleton: true,
    dockPinned: false,
    fileTypes: [],
  },
  trash: {
    id: 'trash',
    name: 'Trash',
    icon: '/icons/trash.svg',
    defaultSize: { w: 680, h: 420 },
    minSize: { w: 420, h: 280 },
    singleton: true,
    dockPinned: false,
    fileTypes: [],
  },
}

/** Dock order (left to right) for pinned apps. */
export const DOCK_ORDER: AppId[] = ['finder', 'safari', 'mail', 'notes', 'terminal', 'preview', 'settings']

/** The app shown in the menu bar for a window: Trash windows belong to Finder. */
export const menuAppOf = (id: AppId): AppId => (id === 'trash' ? 'finder' : id)
