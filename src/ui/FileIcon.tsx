import type { FSNode } from '@/content/schema'
import { iconFor, publicUrl, resolveAlias } from '@/os/fs'
import { vfs } from '@/os/vfs'

/** The small curved arrow macOS puts on alias icons. */
function AliasBadge({ size }: { size: number }) {
  const s = Math.max(10, Math.round(size * 0.3))
  return (
    <svg className="alias-badge" width={s} height={s} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="0.5" y="0.5" width="15" height="15" rx="3" fill="#fff" stroke="rgb(0 0 0 / .25)" />
      <path d="M5 11.5V9a3 3 0 0 1 3-3h3.5" fill="none" stroke="#1d1d1f" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 3.8 12 6l-2.5 2.2" fill="none" stroke="#1d1d1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Icon for a filesystem node; images show a thumbnail and aliases get the arrow badge. */
export function FileIcon({ node, size = 64, className = '' }: { node: FSNode; size?: number; className?: string }) {
  const target = resolveAlias(vfs, node)
  if (target && target !== node) {
    return (
      <span className="alias-icon" style={{ width: size, height: size }}>
        <FileIcon node={target} size={size} className={className} />
        <AliasBadge size={size} />
      </span>
    )
  }
  if (node.type === 'file' && node.kind === 'image') {
    return (
      <img
        src={publicUrl(node.source)}
        alt=""
        width={size}
        height={size}
        className={`thumb object-cover ${className}`}
        style={{ width: size * 0.82, height: size * 0.82 }}
        draggable={false}
        loading="lazy"
      />
    )
  }
  return <img src={iconFor(node)} alt="" width={size} height={size} className={className} draggable={false} />
}
