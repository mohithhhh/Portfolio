'use client'
import { useEffect } from 'react'
import { useSystem } from '@/os/stores/system'

/** Mirrors system settings onto <html> and runs the frame-rate watchdog. */
export function SystemEffects() {
  const theme = useSystem((s) => s.theme)
  const transparency = useSystem((s) => s.transparency)
  const autoFrosted = useSystem((s) => s.autoFrosted)
  const motion = useSystem((s) => s.motion)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    root.setAttribute('data-transparency', transparency === 'frosted' || autoFrosted ? 'frosted' : 'glass')
    if (motion === 'reduce') root.setAttribute('data-motion', 'reduce')
    else root.removeAttribute('data-motion')
  }, [theme, transparency, autoFrosted, motion])

  // Blur budget safety net: if frames stay slow for 3 consecutive seconds
  // while the page is visible, fall back to the frosted material.
  useEffect(() => {
    if (transparency !== 'glass' || autoFrosted) return
    let raf = 0
    let frames = 0
    let windowStart = performance.now()
    let slowSeconds = 0
    const loop = (t: number) => {
      frames++
      if (t - windowStart >= 1000) {
        const fps = (frames * 1000) / (t - windowStart)
        slowSeconds = document.visibilityState === 'visible' && fps < 38 ? slowSeconds + 1 : 0
        frames = 0
        windowStart = t
        if (slowSeconds >= 3) {
          useSystem.getState().setAutoFrosted(true)
          return
        }
      }
      raf = requestAnimationFrame(loop)
    }
    // Give the boot animation time to finish before measuring.
    const start = setTimeout(() => (raf = requestAnimationFrame(loop)), 4000)
    return () => {
      clearTimeout(start)
      cancelAnimationFrame(raf)
    }
  }, [transparency, autoFrosted])

  return null
}
