import { readStats } from '@/server/stats'

let cache: { at: number; body: Awaited<ReturnType<typeof readStats>> } | null = null

export async function GET() {
  if (!cache || Date.now() - cache.at > 60_000) {
    try {
      cache = { at: Date.now(), body: await readStats() }
    } catch {
      return Response.json({ message: 'Stats are unavailable.' }, { status: 503 })
    }
  }
  return Response.json(cache.body, {
    headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=30' },
  })
}
