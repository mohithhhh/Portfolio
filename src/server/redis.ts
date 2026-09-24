import 'server-only'
import { Redis } from '@upstash/redis'

/**
 * Redis from the Vercel Marketplace (Upstash). The integration injects
 * KV_REST_API_URL / KV_REST_API_TOKEN; a direct Upstash database uses
 * UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Either works.
 * Returns null when not configured, so local dev runs without Redis.
 */
let client: Redis | null | undefined

export function getRedis(): Redis | null {
  if (client !== undefined) return client
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  client = url && token ? new Redis({ url, token }) : null
  return client
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim()
}
