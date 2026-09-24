'use client'
import type { IosAppProps } from '@/os/registry'
import { IOSNav } from '@/ui/IOSNav'
import { ComposeFields, SentState } from './ComposeForm'
import { useCompose } from './useCompose'

export default function MailIOS({ onClose }: IosAppProps) {
  const c = useCompose()
  return (
    <div className="ios-screen">
      <IOSNav
        title="New Message"
        onBack={onClose}
        backLabel="Cancel"
        right={
          c.status !== 'sent' && (
            <button className="ios-nav-action is-strong" onClick={() => void c.send()} disabled={c.status === 'sending'}>
              {c.status === 'sending' ? 'Sending…' : 'Send'}
            </button>
          )
        }
      />
      <div className="ios-scroll">{c.status === 'sent' ? <SentState c={c} /> : <ComposeFields c={c} />}</div>
    </div>
  )
}
