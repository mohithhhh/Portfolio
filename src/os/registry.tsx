'use client'
// Client app registry: components (lazy-loaded) and window chrome per app,
// on top of the pure metadata in apps-meta.ts. The dock, menu bar,
// Spotlight, "Open With" and the iOS home screen all read from APPS.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { APPS, type AppId, type AppMeta } from './apps-meta'
import type { Win } from './stores/windows'

export type AppProps = { win: Win; focused: boolean }
export type IosAppProps = { onClose: () => void }

/**
 * toolbar: the app draws its own unified toolbar (drag region) and the
 * traffic lights float over it. titlebar: the window draws a plain title bar.
 */
export type Chrome = 'toolbar' | 'titlebar'

export type AppDefinition = AppMeta & {
  chrome: Chrome
  component: LazyExoticComponent<ComponentType<AppProps>>
  iosComponent?: LazyExoticComponent<ComponentType<IosAppProps>>
  resizable: boolean
}

const def = (
  id: AppId,
  chrome: Chrome,
  component: () => Promise<{ default: ComponentType<AppProps> }>,
  ios?: () => Promise<{ default: ComponentType<IosAppProps> }>,
  resizable = true,
): AppDefinition => ({
  ...APPS[id],
  chrome,
  component: lazy(component),
  iosComponent: ios ? lazy(ios) : undefined,
  resizable,
})

export const REGISTRY: Record<AppId, AppDefinition> = {
  finder: def('finder', 'toolbar', () => import('@/apps/finder/Finder'), () => import('@/apps/finder/FilesIOS')),
  preview: def('preview', 'toolbar', () => import('@/apps/preview/Preview'), () => import('@/apps/preview/ResumeIOS')),
  textedit: def('textedit', 'titlebar', () => import('@/apps/textedit/TextEdit')),
  notes: def('notes', 'toolbar', () => import('@/apps/notes/Notes'), () => import('@/apps/notes/NotesIOS')),
  mail: def('mail', 'toolbar', () => import('@/apps/mail/Mail'), () => import('@/apps/mail/MailIOS')),
  terminal: def('terminal', 'titlebar', () => import('@/apps/terminal/Terminal'), () => import('@/apps/terminal/MessagesIOS')),
  safari: def('safari', 'toolbar', () => import('@/apps/safari/Safari')),
  settings: def('settings', 'toolbar', () => import('@/apps/settings/Settings'), () => import('@/apps/settings/SettingsIOS')),
  about: def('about', 'titlebar', () => import('@/apps/about/About'), () => import('@/apps/about/AboutIOS'), false),
  'activity-monitor': def('activity-monitor', 'toolbar', () => import('@/apps/activity-monitor/ActivityMonitor')),
  trash: def('trash', 'toolbar', () => import('@/apps/trash/Trash')),
}
