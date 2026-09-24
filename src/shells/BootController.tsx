'use client'
import { useEffect } from 'react'
import { useSystem } from '@/os/stores/system'
import { sessionFlag } from '@/os/storage'

import { BOOT_FLAG } from '@/os/keys'
const FULL_MS = 2350
/** Phones skip the laptop lid: monogram and progress bar only. */
const PHONE_MS = 1100
const REDUCED_MS = 300

/** Dismisses the server-rendered boot screen: after the animation, on skip, or instantly for returning visitors. */
export function BootController() {
  const setBooted = useSystem((s) => s.setBooted)
  useEffect(() => {
    const el = document.getElementById('boot')
    let done = false
    const finish = () => {
      if (done) return
      done = true
      el?.classList.add('is-done')
      sessionFlag(BOOT_FLAG, true)
      setBooted(true)
      cleanup()
    }
    const onSkip = (e: Event) => {
      // Let the "Simple version" link work.
      if (e.target instanceof HTMLAnchorElement) return
      finish()
    }
    const cleanup = () => {
      window.removeEventListener('keydown', onSkip, true)
      window.removeEventListener('pointerdown', onSkip, true)
      clearTimeout(timer)
    }
    if (sessionFlag(BOOT_FLAG) || document.documentElement.hasAttribute('data-booted')) {
      finish()
      return
    }
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || useSystem.getState().motion === 'reduce'
    const phone = document.documentElement.dataset.shell === 'ios'
    const min = reduced ? REDUCED_MS : phone ? PHONE_MS : FULL_MS
    const timer = setTimeout(finish, Math.max(0, min - performance.now()))
    window.addEventListener('keydown', onSkip, true)
    window.addEventListener('pointerdown', onSkip, true)
    return cleanup
  }, [setBooted])
  return null
}
