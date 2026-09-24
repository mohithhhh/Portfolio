import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

export function IOSNav({ title, onBack, backLabel = 'Back', right, large }: { title: string; onBack?: () => void; backLabel?: string; right?: ReactNode; large?: boolean }) {
  return (
    <header className={`ios-nav ${large ? 'is-large' : ''}`}>
      <div className="ios-nav-bar">
        <div className="ios-nav-side">
          {onBack && (
            <button className="ios-nav-back" onClick={onBack}>
              <ChevronLeft size={22} /> {backLabel}
            </button>
          )}
        </div>
        {!large && <h1 className="ios-nav-title">{title}</h1>}
        <div className="ios-nav-side is-right">{right}</div>
      </div>
      {large && <h1 className="ios-large-title">{title}</h1>}
    </header>
  )
}
