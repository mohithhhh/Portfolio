import { create } from 'zustand'
import { AGENT_LIMITS } from '@/lib/agent'

export type AgentMessage = { id: string; role: 'user' | 'assistant'; content: string; kind?: 'resting' | 'error' }
export type AgentStatus = 'idle' | 'streaming' | 'resting' | 'error'

export { AGENT_LIMITS }

type AgentState = {
  messages: AgentMessage[]
  status: AgentStatus
  send: (text: string) => Promise<void>
  clear: () => void
}

let counter = 0
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`

export const useAgent = create<AgentState>()((set, get) => ({
  messages: [],
  status: 'idle',
  clear: () => set({ messages: [], status: 'idle' }),
  async send(raw) {
    const text = raw.trim().slice(0, AGENT_LIMITS.maxInputChars)
    if (!text || get().status === 'streaming') return
    const user: AgentMessage = { id: nextId(), role: 'user', content: text }
    const reply: AgentMessage = { id: nextId(), role: 'assistant', content: '' }
    const history = [...get().messages.filter((m) => !m.kind), user].slice(-AGENT_LIMITS.maxTurns * 2)
    set((s) => ({ messages: [...s.messages, user, reply], status: 'streaming' }))
    const patch = (content: string, kind?: AgentMessage['kind']) =>
      set((s) => ({ messages: s.messages.map((m) => (m.id === reply.id ? { ...m, content, kind } : m)) }))

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      })
      if (!res.ok || !res.body) {
        const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
        const resting = res.status === 429 || body.code === 'resting' || body.code === 'unavailable'
        patch(
          body.message ??
            (resting
              ? 'The agent is resting. Try again later, or send me a message in Mail.'
              : 'Something went wrong talking to the agent.'),
          resting ? 'resting' : 'error',
        )
        set({ status: resting ? 'resting' : 'error' })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        patch(acc)
      }
      if (!acc.trim()) patch("I don't have an answer for that. Ask Mohith directly via Mail.")
      set({ status: 'idle' })
    } catch {
      patch('Network error: could not reach the agent. Check your connection and try again.', 'error')
      set({ status: 'error' })
    }
  },
}))
