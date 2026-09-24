'use client'
import { useEffect, useState } from 'react'
import { RotateCw } from 'lucide-react'
import { Toolbar } from '@/ui/Toolbar'

export type Stats = {
  available: boolean
  requestsToday: number
  requestsTotal: number
  medianLatencyMs: number | null
  tokensInToday: number
  tokensOutToday: number
  updatedAt: string
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let cancelled = false
    fetch('/api/stats')
      .then((r) => (r.ok ? (r.json() as Promise<Stats>) : Promise.reject(new Error(String(r.status)))))
      .then((s) => !cancelled && (setStats(s), setError(false)))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [tick])
  return { stats, error, refresh: () => setTick((t) => t + 1) }
}

const fmt = (n: number) => n.toLocaleString()

export default function ActivityMonitor() {
  const { stats, error, refresh } = useStats()
  const empty = stats && stats.requestsTotal === 0
  const rows: Array<[string, string]> = stats
    ? [
        ['Agent requests today', fmt(stats.requestsToday)],
        ['Agent requests (all time)', fmt(stats.requestsTotal)],
        ['Median latency (today)', stats.medianLatencyMs === null ? '—' : `${fmt(Math.round(stats.medianLatencyMs))} ms`],
        ['Input tokens today', fmt(stats.tokensInToday)],
        ['Output tokens today', fmt(stats.tokensOutToday)],
      ]
    : []
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar inset>
        <h2 className="toolbar-title m-0">Activity Monitor</h2>
        <span className="text-[11px] text-secondary">Portfolio agent</span>
        <div className="toolbar-spacer" />
        <button className="tb-btn" aria-label="Refresh" onClick={refresh}>
          <RotateCw size={14} />
        </button>
      </Toolbar>
      <div className="min-h-0 flex-1 overflow-auto bg-window" data-testid="activity">
        {!stats && !error && <p className="p-6 text-center text-secondary">Loading…</p>}
        {error && <p className="p-6 text-center text-secondary">Stats are unavailable right now.</p>}
        {stats && (empty || !stats.available) && (
          <p className="p-6 text-center text-secondary">
            No activity yet.
            {!stats.available && <><br />Stats storage isn’t configured on this deployment.</>}
          </p>
        )}
        {stats && !empty && stats.available && (
          <table className="finder-list activity-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="text-right tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {stats && <div className="finder-status">Updated {new Date(stats.updatedAt).toLocaleTimeString()} · cached for 60s</div>}
    </div>
  )
}
