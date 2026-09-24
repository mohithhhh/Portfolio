'use client'
import { useState } from 'react'
import { z } from 'zod'
import { profile } from '@/content'
import { contactSchema } from '@/lib/contact'

export type ComposeStatus = 'idle' | 'sending' | 'sent' | 'error'

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function useCompose(initialSubject = '') {
  const [fields, setFields] = useState({ name: '', email: '', subject: initialSubject, message: '', website: '' })
  const [status, setStatus] = useState<ComposeStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | undefined>()

  const set = (k: keyof typeof fields) => (v: string) => setFields((f) => ({ ...f, [k]: v }))

  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(fields.subject || 'Hello')}&body=${encodeURIComponent(fields.message)}`

  async function send() {
    const parsed = contactSchema.safeParse({ ...fields, turnstileToken: token })
    if (!parsed.success) {
      setError(z.prettifyError(parsed.error).replace(/^✖ /gm, '').split('\n')[0] ?? 'Please check the form.')
      setStatus('error')
      return
    }
    if (TURNSTILE_SITE_KEY && !token) {
      setError('Please complete the spam check first.')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        setError(body.message ?? `The message could not be sent (error ${res.status}).`)
        setStatus('error')
        return
      }
      setStatus('sent')
    } catch {
      setError('Network error: the message could not be sent.')
      setStatus('error')
    }
  }

  const reset = () => {
    setFields({ name: '', email: '', subject: '', message: '', website: '' })
    setStatus('idle')
    setError(null)
  }

  return { fields, set, status, error, send, reset, mailto, setToken }
}
