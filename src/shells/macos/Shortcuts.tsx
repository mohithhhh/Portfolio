'use client'
// Browser-safe keyboard shortcuts. Browsers reserve ⌘W/⌘Q/⌘Tab/⌘N/⌘Space,
// so the working bindings use Option (⌥) instead; see Help → Keyboard Shortcuts.
import { useEffect } from 'react'
import { menuAppOf } from '@/os/apps-meta'
import { activateApp } from '@/os/actions'
import { useUi } from '@/os/stores/ui'
import { useWindows } from '@/os/stores/windows'
import { switcherApps } from './Overlays'

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

export function Shortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      const ws = useWindows.getState()
      const focused = ws.windows.find((w) => w.id === ws.focusedId)

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        ui.setSpotlight(!ui.spotlightOpen)
        return
      }
      if (e.key === '/' && !isTyping(e.target) && !ui.spotlightOpen) {
        e.preventDefault()
        ui.setSpotlight(true)
        return
      }
      if (e.key === 'F10' && !e.shiftKey) {
        e.preventDefault()
        window.dispatchEvent(new Event('menubar:focus'))
        return
      }
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        switch (e.code) {
          case 'KeyW':
            e.preventDefault()
            if (focused) ws.close(focused.id)
            return
          case 'KeyQ':
            e.preventDefault()
            if (focused) {
              const app = menuAppOf(focused.appId)
              ws.quitApp(app)
              if (app === 'finder') ws.quitApp('trash')
            }
            return
          case 'KeyM':
            e.preventDefault()
            if (focused) ws.minimize(focused.id)
            return
          case 'Tab': {
            e.preventDefault()
            const n = switcherApps().length
            if (!ui.switcherOpen) ui.setSwitcher(true, n > 1 ? 1 : 0)
            else ui.setSwitcher(true, (ui.switcherIndex + (e.shiftKey ? n - 1 : 1)) % n)
            return
          }
        }
      }
      if (e.key === 'Escape') {
        if (ui.switcherOpen) ui.setSwitcher(false)
        if (ui.contextMenu) ui.closeContextMenu()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const ui = useUi.getState()
      if (e.key === 'Alt' && ui.switcherOpen) {
        const apps = switcherApps()
        const pick = apps[ui.switcherIndex % apps.length]
        ui.setSwitcher(false)
        if (pick) activateApp(pick)
      }
    }
    const onBlur = () => useUi.getState().setSwitcher(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
  return null
}
