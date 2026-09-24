'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useSystem } from './stores/system'
import { useWindows } from './stores/windows'

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', cb)
    return () => mq.removeEventListener('change', cb)
  }
}

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

/** True when the OS asks for reduced motion or the user set it in System Settings. */
export function useReducedMotion() {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')
  const pref = useSystem((s) => s.motion)
  return system || pref === 'reduce'
}

export function useDarkMode() {
  const theme = useSystem((s) => s.theme)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  return theme === 'dark' || (theme === 'auto' && systemDark)
}

/** Keeps the window store's viewport in sync with the browser window. */
export function useViewportSync() {
  const setViewport = useWindows((s) => s.setViewport)
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setViewport])
}

/** A clock that ticks every `intervalMs`, aligned to the next boundary. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      const d = new Date()
      setNow(d)
      t = setTimeout(tick, intervalMs - (d.getTime() % intervalMs) + 5)
    }
    tick()
    return () => clearTimeout(t)
  }, [intervalMs])
  return now
}

export function formatMenuClock(d: Date) {
  const day = d.toLocaleDateString(undefined, { weekday: 'short' })
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day} ${date}  ${time}`
}
