'use client'
import { Send } from 'lucide-react'
import type { AppProps } from '@/os/registry'
import { Toolbar } from '@/ui/Toolbar'
import { ComposeFields, SentState } from './ComposeForm'
import { useCompose } from './useCompose'

export default function Mail({ win }: AppProps) {
  const c = useCompose((win.payload?.subject as string | undefined) ?? '')
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar inset>
        <h2 className="toolbar-title m-0">New Message</h2>
        <div className="toolbar-spacer" />
        {c.status !== 'sent' && (
          <button className="btn btn-primary" onClick={() => void c.send()} disabled={c.status === 'sending'} data-testid="mail-send">
            <Send size={14} /> {c.status === 'sending' ? 'Sending…' : 'Send'}
          </button>
        )}
      </Toolbar>
      <div className="min-h-0 flex-1 overflow-y-auto bg-window">{c.status === 'sent' ? <SentState c={c} /> : <ComposeFields c={c} />}</div>
    </div>
  )
}
