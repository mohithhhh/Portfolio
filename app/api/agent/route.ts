import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { z } from 'zod'
import { AGENT_LIMITS } from '@/lib/agent'
import { SYSTEM_PROMPT } from '@/server/agent-prompt'
import { allow } from '@/server/ratelimit'
import { clientIp } from '@/server/redis'
import { recordAgentCall } from '@/server/stats'

export const maxDuration = 30

const DEFAULT_MODEL = 'claude-haiku-4-5'
const MAX_OUTPUT_TOKENS = 400

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .min(1)
    .max(AGENT_LIMITS.maxTurns * 2),
})

const json = (status: number, code: string, message: string) => Response.json({ code, message }, { status })

const RESTING = "The agent is resting. Try again later, or send me a message in Mail."

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return json(400, 'invalid', 'That request could not be read.')
  }
  const last = body.messages[body.messages.length - 1]!
  if (last.role !== 'user') return json(400, 'invalid', 'The last message must be from you.')
  if (last.content.trim().length === 0) return json(400, 'invalid', 'Ask me something about my work.')
  if (last.content.length > AGENT_LIMITS.maxInputChars) {
    return json(413, 'too-long', `Please keep questions under ${AGENT_LIMITS.maxInputChars} characters.`)
  }

  const ip = clientIp(req)
  const ok = await allow('agent', ip, [
    { name: '10m', limit: 10, window: '10 m' },
    { name: '1d', limit: 50, window: '1 d' },
  ]).catch(() => true)
  if (!ok) return json(429, 'resting', RESTING)

  // Test/dev stub: deterministic streamed reply without calling a model.
  if (process.env.AGENT_MOCK === '1') {
    const reply = 'I build ML systems. Ask Mohith D K directly via Mail for anything else.'
    return new Response(
      new ReadableStream({
        start(c) {
          const enc = new TextEncoder()
          for (const w of reply.split(' ')) c.enqueue(enc.encode(w + ' '))
          c.close()
        },
      }),
      { headers: { 'content-type': 'text/plain; charset=utf-8' } },
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, 'unavailable', "The agent isn't switched on for this site yet. Send me a message in Mail instead.")
  }

  const anthropic = createAnthropic()
  const started = Date.now()
  const result = streamText({
    model: anthropic(process.env.AGENT_MODEL || DEFAULT_MODEL),
    instructions: SYSTEM_PROMPT,
    messages: body.messages.map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.3,
    abortSignal: req.signal,
    onEnd: async ({ totalUsage }) => {
      await recordAgentCall(Date.now() - started, totalUsage.inputTokens ?? 0, totalUsage.outputTokens ?? 0).catch(() => {})
    },
    onError: ({ error }) => {
      // Log the failure type only, never message content.
      console.error('[agent] stream error', error instanceof Error ? error.name : 'unknown')
    },
  })
  return result.toTextStreamResponse({ headers: { 'cache-control': 'no-store' } })
}
