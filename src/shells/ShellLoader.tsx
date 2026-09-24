'use client'
import dynamic from 'next/dynamic'
import { useEffect, useSyncExternalStore } from 'react'
import { useSystem, type Shell } from '@/os/stores/system'
import { BootController } from './BootController'
import { SystemEffects } from './SystemEffects'
import type { InitialAction } from './types'

// Only the chosen shell's code is downloaded.
const MacShell = dynamic(() => import('./macos/MacShell'), { ssr: false })
const IOSShell = dynamic(() => import('./ios/IOSShell'), { ssr: false })

const noop = () => () => {}

/** Same rule as the inline script in app/layout.tsx. */
export function detectShell(): Shell {
  return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900 ? 'ios' : 'macos'
}

export function ShellLoader({ initial }: { initial?: InitialAction }) {
  // The shell is chosen once per page load (by the inline script in layout.tsx).
  const shell = useSyncExternalStore(
    noop,
    () => (document.documentElement.dataset.shell as Shell | undefined) ?? detectShell(),
    () => null,
  )
  useEffect(() => {
    if (!shell) return
    useSystem.getState().setShell(shell)
    document.body.classList.add('os')
  }, [shell])
  return (
    <>
      <SystemEffects />
      <BootController />
      {shell === 'macos' && <MacShell initial={initial} />}
      {shell === 'ios' && <IOSShell initial={initial} />}
    </>
  )
}
