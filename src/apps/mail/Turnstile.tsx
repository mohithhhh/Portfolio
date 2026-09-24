'use client'
import { useEffect, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from './useCompose'

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; 'expired-callback'?: () => void; theme?: string }) => string
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Cloudflare Turnstile widget. Renders nothing when no site key is configured. */
export function Turnstile({ onToken }: { onToken: (t: string | undefined) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return
    let id: string | undefined
    let cancelled = false
    const mount = () => {
      if (cancelled || !window.turnstile || !ref.current) return
      id = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY!,
        callback: (t) => onToken(t),
        'expired-callback': () => onToken(undefined),
        theme: 'auto',
      })
    }
    if (window.turnstile) mount()
    else {
      let s = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
      if (!s) {
        s = document.createElement('script')
        s.src = SCRIPT
        s.async = true
        document.head.appendChild(s)
      }
      s.addEventListener('load', mount)
    }
    return () => {
      cancelled = true
      if (id) window.turnstile?.remove(id)
    }
  }, [onToken])
  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={ref} className="mt-2" />
}
