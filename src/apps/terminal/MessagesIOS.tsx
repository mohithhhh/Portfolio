'use client'
import { ArrowUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { profile } from '@/content'
import type { IosAppProps } from '@/os/registry'
import { AGENT_LIMITS, useAgent } from '@/os/stores/agent'
import { IOSNav } from '@/ui/IOSNav'

const SUGGESTIONS = ['What are you building now?', 'Tell me about your research', 'What did you do at Maersk?', 'Which skills do you use most?']

export default function MessagesIOS({ onClose }: IosAppProps) {
  const messages = useAgent((s) => s.messages)
  const status = useAgent((s) => s.status)
  const send = useAgent((s) => s.send)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [messages])

  const submit = (t: string) => {
    if (!t.trim() || status === 'streaming') return
    void send(t)
    setText('')
  }

  return (
    <div className="ios-screen">
      <IOSNav title={profile.name} onBack={onClose} backLabel="Home" />
      <div className="ios-thread" aria-live="polite">
        <p className="ios-thread-note">Ask my portfolio assistant about my work. Answers come only from my resume.</p>
        {messages.length === 0 && (
          <div className="ios-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => submit(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`ios-bubble ${m.role === 'user' ? 'is-me' : ''} ${m.kind ? 'is-note' : ''}`}>
            {m.content || (status === 'streaming' ? '…' : '')}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="ios-composer"
        onSubmit={(e) => {
          e.preventDefault()
          submit(text)
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="iMessage"
          aria-label="Message"
          maxLength={AGENT_LIMITS.maxInputChars}
        />
        <button type="submit" aria-label="Send" disabled={!text.trim() || status === 'streaming'}>
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}
