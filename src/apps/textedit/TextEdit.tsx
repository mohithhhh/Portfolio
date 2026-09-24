'use client'
import { MdxDocument } from '@/content/mdx'
import type { AppProps } from '@/os/registry'
import { vfs } from '@/os/vfs'

export default function TextEdit({ win }: AppProps) {
  const node = win.payload?.nodeId ? vfs.byId.get(win.payload.nodeId) : undefined
  if (!node || node.type !== 'file' || node.kind !== 'md') {
    return <div className="grid flex-1 place-items-center text-secondary">No document open.</div>
  }
  return (
    <div className="textedit selectable" data-testid="textedit">
      <MdxDocument source={node.source} />
    </div>
  )
}
