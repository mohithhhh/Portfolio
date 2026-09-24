import type { FSNode } from '@/content/schema'
import { iconFor, publicUrl } from '@/os/fs'

/** Icon for a filesystem node; images show a thumbnail like Finder does. */
export function FileIcon({ node, size = 64, className = '' }: { node: FSNode; size?: number; className?: string }) {
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
