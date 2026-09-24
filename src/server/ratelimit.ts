import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from './redis'

type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`
export type Rule = { name: string; limit: number; window: Window }

const toMs = (w: Window) => {
  const [n, unit] = w.split(' ') as [string, 's' | 'm' | 'h' | 'd']
  return Number(n) * { s: 1e3, m: 6e4, h: 3.6e6, d: 8.64e7 }[unit]
}

// In-memory fallback (per server instance) when Redis isn't configured.
const memory = new Map<string, number[]>()
function memoryLimit(key: string, rule: Rule): boolean {
  const now = Date.now()
  const hits = (memory.get(key) ?? []).filter((t) => now - t < toMs(rule.window))
  if (hits.length >= rule.limit) {
    memory.set(key, hits)
    return false
  }
  hits.push(now)
  memory.set(key, hits)
  return true
}

const limiters = new Map<string, Ratelimit>()

/** Checks every rule for `id`; returns false as soon as one is exhausted. */
export async function allow(prefix: string, id: string, rules: Rule[]): Promise<boolean> {
  const redis = getRedis()
  for (const rule of rules) {
    const key = `${prefix}:${rule.name}`
    if (!redis) {
      if (!memoryLimit(`${key}:${id}`, rule)) return false
      continue
    }
    let rl = limiters.get(key)
    if (!rl) {
      rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(rule.limit, rule.window), prefix: `rl:${key}` })
      limiters.set(key, rl)
    }
    const { success } = await rl.limit(id)
    if (!success) return false
  }
  return true
}
