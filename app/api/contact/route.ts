import { Resend } from 'resend'
import { z } from 'zod'
import { profile } from '@/content'
import { contactSchema } from '@/lib/contact'
import { allow } from '@/server/ratelimit'
import { clientIp } from '@/server/redis'

const json = (status: number, message: string) => Response.json({ message }, { status })

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  const form = new URLSearchParams({ secret, response: token, remoteip: ip })
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const data = (await res.json().catch(() => ({ success: false }))) as { success?: boolean }
  return data.success === true
}

export async function POST(req: Request) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return json(400, 'That request could not be read.')
  }
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success.
    if (typeof raw === 'object' && raw && 'website' in raw && (raw as { website?: string }).website) {
      return Response.json({ ok: true })
    }
    return json(400, z.prettifyError(parsed.error).replace(/^✖ /gm, '').split('\n')[0] ?? 'Please check the form.')
  }
  const data = parsed.data
  const ip = clientIp(req)

  const ok = await allow('contact', ip, [
    { name: '1h', limit: 5, window: '1 h' },
    { name: '1d', limit: 20, window: '1 d' },
  ]).catch(() => true)
  if (!ok) return json(429, 'Too many messages from your network. Please try again later or email directly.')

  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return json(403, 'The spam check failed. Please try again.')
  }

  const key = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL
  if (!key || !from) return json(503, "Email isn't set up on this deployment yet.")

  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from,
    to: process.env.CONTACT_TO_EMAIL || profile.email,
    replyTo: data.email,
    subject: `[Portfolio] ${data.subject || `Message from ${data.name}`}`,
    text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
  })
  if (error) return json(502, 'The email service rejected the message. Please try again later.')
  return Response.json({ ok: true })
}
