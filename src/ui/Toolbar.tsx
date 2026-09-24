import type { ReactNode } from 'react'

/**
 * Unified window toolbar. It is the window's drag region; `inset` leaves room
 * for the traffic lights when there is no sidebar underneath them.
 */
export function Toolbar({ children, inset = false, className = '' }: { children: ReactNode; inset?: boolean; className?: string }) {
  return (
    <div className={`toolbar ${className}`} data-drag-region style={inset ? { paddingLeft: 92 } : undefined}>
      {children}
    </div>
  )
}

export function SidebarItem({
  icon,
  label,
  current,
  onClick,
  testId,
}: {
  icon: ReactNode
  label: string
  current?: boolean
  onClick: () => void
  testId?: string
}) {
  return (
    <button className="sidebar-item" aria-current={current || undefined} onClick={onClick} data-testid={testId}>
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}
