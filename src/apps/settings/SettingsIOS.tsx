'use client'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { IOSNav } from '@/ui/IOSNav'
import { PaneContent, PANES, type PaneId } from './panes'

export default function SettingsIOS() {
  const [pane, setPane] = useState<PaneId | null>(null)
  const current = PANES.find((p) => p.id === pane)
  if (current) {
    return (
      <div className="ios-screen">
        <IOSNav title={current.label} onBack={() => setPane(null)} backLabel="Settings" />
        <div className="ios-scroll settings-body">
          <PaneContent id={current.id} />
        </div>
      </div>
    )
  }
  return (
    <div className="ios-screen">
      <IOSNav title="Settings" large />
      <ul className="ios-list is-grouped">
        {PANES.map((p) => (
          <li key={p.id}>
            <button className="ios-row" onClick={() => setPane(p.id)}>
              <span className="settings-icon is-ios" style={{ background: p.color }}>
                <p.icon size={16} />
              </span>
              <span className="ios-row-text">
                <strong>{p.label}</strong>
              </span>
              <ChevronRight size={18} className="text-tertiary" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
