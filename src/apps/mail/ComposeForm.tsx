'use client'
import { motion } from 'motion/react'
import { Send } from 'lucide-react'
import { profile } from '@/content'
import { useReducedMotion } from '@/os/hooks'
import { Turnstile } from './Turnstile'
import type { useCompose } from './useCompose'

type Compose = ReturnType<typeof useCompose>

export function ComposeFields({ c }: { c: Compose }) {
  return (
    <form
      className="compose"
      onSubmit={(e) => {
        e.preventDefault()
        void c.send()
      }}
      aria-label="New message"
    >
      <div className="compose-row">
        <span className="compose-label">To:</span>
        <span className="compose-chip">
          {profile.name} &lt;{profile.email}&gt;
        </span>
      </div>
      <label className="compose-row">
        <span className="compose-label">From:</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={c.fields.name}
          onChange={(e) => c.set('name')(e.target.value)}
          required
          aria-label="Your name"
        />
      </label>
      <label className="compose-row">
        <span className="compose-label">Reply-To:</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={c.fields.email}
          onChange={(e) => c.set('email')(e.target.value)}
          required
          aria-label="Your email"
        />
      </label>
      <label className="compose-row">
        <span className="compose-label">Subject:</span>
        <input type="text" name="subject" value={c.fields.subject} onChange={(e) => c.set('subject')(e.target.value)} aria-label="Subject" />
      </label>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={c.fields.website}
        onChange={(e) => c.set('website')(e.target.value)}
        className="honeypot"
        aria-hidden="true"
      />
      <textarea
        name="message"
        placeholder={`Write to ${profile.name.split(' ')[0]}…`}
        value={c.fields.message}
        onChange={(e) => c.set('message')(e.target.value)}
        aria-label="Message"
        required
      />
      <Turnstile onToken={c.setToken} />
      {c.status === 'error' && c.error && (
        <p className="compose-error" role="alert">
          {c.error}{' '}
          <a href={c.mailto}>Send with your email app instead</a>.
        </p>
      )}
      <button type="submit" hidden />
    </form>
  )
}

export function SentState({ c }: { c: Compose }) {
  const reduced = useReducedMotion()
  return (
    <div className="compose-sent" role="status">
      <motion.div
        initial={reduced ? { opacity: 0 } : { y: 0, rotate: 0, opacity: 1, scale: 1 }}
        animate={reduced ? { opacity: 1 } : { y: [0, -12, -240], rotate: [0, -8, -18], opacity: [1, 1, 0], scale: [1, 1.05, 0.6] }}
        transition={{ duration: reduced ? 0.2 : 0.9, ease: 'easeIn' }}
        aria-hidden="true"
      >
        <Send size={44} className="text-accent" />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 0.7 }} className="grid justify-items-center gap-2">
        <strong className="text-[17px]">Message sent</strong>
        <p className="m-0 text-secondary">Thanks! {profile.name.split(' ')[0]} will reply to your email.</p>
        <button className="btn mt-2" onClick={c.reset}>
          New Message
        </button>
      </motion.div>
    </div>
  )
}
