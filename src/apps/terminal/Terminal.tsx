'use client'
import { useEffect, useRef, useState } from 'react'
import { openApp, openNode } from '@/os/actions'
import { completePath, HOME_ID } from '@/os/fs'
import type { AppProps } from '@/os/registry'
import { useAgent } from '@/os/stores/agent'
import { vfs } from '@/os/vfs'
import { promptFor, runCommand, tokenize, type OutLine } from './commands'

type Entry = { id: number; prompt?: string; command?: string; lines: OutLine[]; agentMessageId?: string }

let seq = 0

function welcome(): Entry {
  const d = new Date()
  return {
    id: seq++,
    lines: [
      { text: `Last login: ${d.toDateString()} ${d.toTimeString().slice(0, 8)} on ttys000`, tone: 'muted' },
      { text: "Type 'help' to see commands, or ask me anything about Mohith's work.", tone: 'muted' },
    ],
  }
}

export default function Terminal({ focused }: AppProps) {
  const [entries, setEntries] = useState<Entry[]>(() => [welcome()])
  const [cwd, setCwd] = useState(HOME_ID)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIndex, setHistIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messages = useAgent((s) => s.messages)
  const status = useAgent((s) => s.status)
  const send = useAgent((s) => s.send)

  useEffect(() => {
    if (focused) inputRef.current?.focus({ preventScroll: true })
  }, [focused])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries, messages])
  useEffect(() => {
    const onClear = () => setEntries([])
    window.addEventListener('terminal:clear', onClear)
    return () => window.removeEventListener('terminal:clear', onClear)
  }, [])

  const prompt = promptFor(vfs, cwd)

  const submit = () => {
    const line = input
    setInput('')
    setHistIndex(null)
    if (line.trim()) setHistory((h) => [...h, line])
    const result = runCommand(line, { ix: vfs, cwdId: cwd, history: [...history, line] })
    if (result.clear) {
      setEntries([])
      return
    }
    const entry: Entry = { id: seq++, prompt, command: line, lines: result.output }
    if (result.cwdId) setCwd(result.cwdId)
    if (result.open) {
      if ('nodeId' in result.open) openNode(result.open.nodeId)
      else openApp(result.open.appId)
    }
    if (result.ask) {
      const before = useAgent.getState().messages.length
      void send(result.ask)
      // The assistant reply is the second message appended by send().
      const replyId = useAgent.getState().messages[before + 1]?.id
      entry.agentMessageId = replyId
    }
    setEntries((es) => [...es, entry])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'streaming') submit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const i = histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1)
      setHistIndex(i)
      setInput(history[i] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIndex === null) return
      const i = histIndex + 1
      if (i >= history.length) {
        setHistIndex(null)
        setInput('')
      } else {
        setHistIndex(i)
        setInput(history[i] ?? '')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const words = tokenize(input)
      if (words.length < 2 && !input.endsWith(' ')) return
      const lastRaw = input.endsWith(' ') ? '' : (input.match(/((?:\\ |[^ ])+)$/)?.[1] ?? '')
      const partial = lastRaw.replace(/\\ /g, ' ')
      const { completed, candidates } = completePath(vfs, cwd, partial)
      if (candidates.length > 1) {
        setEntries((es) => [...es, { id: seq++, prompt, command: input, lines: [{ text: candidates.join('    '), tone: 'dir' }] }])
      }
      setInput(input.slice(0, input.length - lastRaw.length) + completed)
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setEntries([])
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      setEntries((es) => [...es, { id: seq++, prompt, command: input + '^C', lines: [] }])
      setInput('')
    }
  }

  return (
    <div
      ref={scrollRef}
      className="terminal selectable"
      onMouseUp={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true })
      }}
      data-testid="terminal"
    >
      {entries.map((entry) => {
        const reply = entry.agentMessageId ? messages.find((m) => m.id === entry.agentMessageId) : undefined
        return (
          <div key={entry.id}>
            {entry.command !== undefined && (
              <div>
                <span className="term-prompt">{entry.prompt}</span> {entry.command}
              </div>
            )}
            {entry.lines.map((l, i) => (
              <div key={i} className={l.tone ? `term-${l.tone}` : undefined}>
                {l.text || ' '}
              </div>
            ))}
            {reply && (
              <div className={`term-agent ${reply.kind ? `term-${reply.kind === 'resting' ? 'muted' : 'error'}` : ''}`} aria-live="polite">
                {reply.content || (status === 'streaming' ? '…' : '')}
              </div>
            )}
          </div>
        )
      })}
      <div className="term-input-row">
        <label htmlFor="term-input" className="term-prompt">
          {prompt}
        </label>
        <input
          id="term-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Terminal input"
          data-testid="terminal-input"
          disabled={status === 'streaming'}
        />
      </div>
    </div>
  )
}
