'use client'
import type { AppProps } from '@/os/registry'
import { useWindows } from '@/os/stores/windows'
import { Toolbar } from '@/ui/Toolbar'
import { PaneContent, PANES, type PaneId } from './panes'

export default function Settings({ win }: AppProps) {
  const setPayload = useWindows((s) => s.setPayload)
  const pane = ((win.payload?.pane as PaneId | undefined) ?? 'appearance') as PaneId
  const current = PANES.find((p) => p.id === pane) ?? PANES[0]!
  return (
    <div className="flex h-full min-h-0">
      <aside className="sidebar glass" aria-label="Settings">
        <nav className="grid gap-0.5">
          {PANES.map((p) => (
            <button key={p.id} className="sidebar-item" aria-current={p.id === pane || undefined} onClick={() => setPayload(win.id, { pane: p.id })}>
              <span className="settings-icon" style={{ background: p.color }}>
                <p.icon size={13} />
              </span>
              {p.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-window-alt">
        <Toolbar>
          <h2 className="toolbar-title m-0">{current.label}</h2>
        </Toolbar>
        <div className="settings-body">
          <PaneContent id={pane} />
        </div>
      </div>
    </div>
  )
}
