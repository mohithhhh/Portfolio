'use client'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { openApp, openNode } from '@/os/actions'
import { useDarkMode, useReducedMotion, useViewportSync } from '@/os/hooks'
import { useFs } from '@/os/stores/fs'
import { useSystem } from '@/os/stores/system'
import { useWindows } from '@/os/stores/windows'
import type { InitialAction } from '../types'
import { Desktop } from './Desktop'
import { Dock } from './Dock'
import { MenuBar } from './MenuBar'
import { AppSwitcher, ContextMenuHost, SheetHost } from './Overlays'
import { QuickLook } from './QuickLook'
import { Shortcuts } from './Shortcuts'
import { Spotlight } from './Spotlight'
import { Window } from './Window'

function runInitial(action: InitialAction) {
  const folder = action.kind === 'project' ? `project-${action.slug}` : `experience-${action.slug}`
  const file = action.kind === 'project' ? `${folder}-readme` : `${folder}-role`
  const finderId = openApp('finder', { payload: { nodeId: folder } })
  useFs.getState().initHistory(finderId, folder)
  openNode(file)
}

function WindowsLayer() {
  const ids = useWindows(useShallow((s) => s.windows.map((w) => w.id)))
  return (
    <div className="windows-layer">
      <AnimatePresence>
        {ids.map((id) => (
          <Window key={id} id={id} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function MacShell({ initial }: { initial?: InitialAction }) {
  useViewportSync()
  const booted = useSystem((s) => s.booted)
  const wallpaper = useSystem((s) => s.wallpaper)
  const dark = useDarkMode()
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!booted || !initial) return
    runInitial(initial)
  }, [booted, initial])

  const slide = (from: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: booted ? 1 : 0 } }
      : {
          initial: { y: from, opacity: 0 },
          animate: booted ? { y: 0, opacity: 1 } : { y: from, opacity: 0 },
          transition: { type: 'spring' as const, stiffness: 260, damping: 30, delay: 0.25 },
        }

  return (
    <div className="mac" data-testid="mac-shell">
      <div
        className="wallpaper"
        style={{ backgroundImage: `url(/wallpapers/${wallpaper}-${dark ? 'dark' : 'light'}.svg)` }}
        aria-hidden="true"
      />
      <main aria-label="Desktop" id="shell-main">
        <Desktop />
        <WindowsLayer />
      </main>
      <motion.div {...slide(-28)} className="shell-layer" style={{ zIndex: 50000 }}>
        <MenuBar />
      </motion.div>
      <motion.div {...slide(110)} className="shell-layer" style={{ zIndex: 40000 }}>
        <Dock />
      </motion.div>
      <Spotlight />
      <QuickLook />
      <ContextMenuHost />
      <AppSwitcher />
      <SheetHost />
      <Shortcuts />
    </div>
  )
}
