'use client'
// One notification per session, ~20s after boot, that introduces Mohith and
// offers a reply. It never appears while the visitor is mid-drag or typing.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { experience, profile } from '@/content'
import { openCompose } from '@/os/actions'
import { useReducedMotion } from '@/os/hooks'
import { sessionFlag } from '@/os/storage'
import { useSystem } from '@/os/stores/system'

const FLAG = 'mdk-pitched'
const DELAY_MS = 20_000
const VISIBLE_MS = 12_000

export function PitchNotification() {
  const booted = useSystem((s) => s.booted)
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const hovered = useRef(false)

  useEffect(() => {
    if (!booted || sessionFlag(FLAG)) return
    const show = setTimeout(() => {
      sessionFlag(FLAG, true)
      setOpen(true)
    }, DELAY_MS)
    return () => clearTimeout(show)
  }, [booted])

  useEffect(() => {
    if (!open) return
    const hide = setInterval(() => {
      if (!hovered.current) setOpen(false)
    }, VISIBLE_MS)
    return () => clearInterval(hide)
  }, [open])

  const role = experience[0]
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="mac-notification glass"
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, x: 380 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, x: 380 }}
          transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 34 }}
          onPointerEnter={() => (hovered.current = true)}
          onPointerLeave={() => (hovered.current = false)}
          data-testid="pitch-notification"
        >
          <button
            className="mac-notification-body"
            onClick={() => {
              setOpen(false)
              openCompose('Hello from your portfolio')
            }}
          >
            <img src="/icons/monogram.svg" alt="" width={38} height={38} />
            <span>
              <strong>
                {profile.name} <small>now</small>
              </strong>
              <span>
                {role ? `${role.role} at ${role.company}. ` : ''}
                {profile.availability.open ? `${profile.availability.label}: ` : ''}click to say hi.
              </span>
            </span>
          </button>
          <button className="mac-notification-close" aria-label="Dismiss notification" onClick={() => setOpen(false)}>
            <X size={12} strokeWidth={2.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
