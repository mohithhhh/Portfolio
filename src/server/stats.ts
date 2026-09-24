import 'server-only'
import { getRedis } from './redis'

// Aggregate agent stats only. Message content is never stored or logged.
const day = (d = new Date()) => d.toISOString().slice(0, 10)
const TTL = 60 * 60 * 24 * 8

export async function recordAgentCall(latencyMs: number, tokensIn: number, tokensOut: number) {
  const redis = getRedis()
  if (!redis) return
  const d = day()
  const p = redis.pipeline()
  p.incr('stats:req:total')
  p.incr(`stats:req:${d}`)
  p.expire(`stats:req:${d}`, TTL)
  p.incrby(`stats:tok_in:${d}`, Math.max(0, Math.round(tokensIn)))
  p.incrby(`stats:tok_out:${d}`, Math.max(0, Math.round(tokensOut)))
  p.expire(`stats:tok_in:${d}`, TTL)
  p.expire(`stats:tok_out:${d}`, TTL)
  p.lpush(`stats:lat:${d}`, Math.round(latencyMs))
  p.ltrim(`stats:lat:${d}`, 0, 999)
  p.expire(`stats:lat:${d}`, TTL)
  await p.exec()
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

export async function readStats() {
  const redis = getRedis()
  const updatedAt = new Date().toISOString()
  if (!redis) {
    return { available: false, requestsToday: 0, requestsTotal: 0, medianLatencyMs: null, tokensInToday: 0, tokensOutToday: 0, updatedAt }
  }
  const d = day()
  const [total, today, tin, tout, lat] = await Promise.all([
    redis.get<number>('stats:req:total'),
    redis.get<number>(`stats:req:${d}`),
    redis.get<number>(`stats:tok_in:${d}`),
    redis.get<number>(`stats:tok_out:${d}`),
    redis.lrange<number>(`stats:lat:${d}`, 0, -1),
  ])
  return {
    available: true,
    requestsToday: Number(today ?? 0),
    requestsTotal: Number(total ?? 0),
    medianLatencyMs: median((lat ?? []).map(Number)),
    tokensInToday: Number(tin ?? 0),
    tokensOutToday: Number(tout ?? 0),
    updatedAt,
  }
}
