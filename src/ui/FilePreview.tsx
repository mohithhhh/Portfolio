'use client'
// Renders any file node inline: used by Quick Look and the iOS Files app.
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { FSNode } from '@/content/schema'
import { MdxDocument } from '@/content/mdx'
import { kindLabel, listChildren, publicUrl } from '@/os/fs'
import { vfs } from '@/os/vfs'
import { FileIcon } from './FileIcon'

const PdfPages = lazy(() => import('@/apps/preview/PdfPages'))

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function FilePreview({ node, pdfPages }: { node: FSNode; pdfPages?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  if (node.type === 'folder') {
    const n = listChildren(vfs, node.id).length
    return (
      <div className="grid h-full w-full place-items-center gap-2 p-10 text-center">
        <FileIcon node={node} size={128} />
        <div>
          <p className="text-[15px] font-semibold">{node.name}</p>
          <p className="text-secondary">
            {n} {n === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    )
  }
  switch (node.kind) {
    case 'image':
      return (
        <div className="grid h-full w-full place-items-center p-4">
          <img src={publicUrl(node.source)} alt={node.name} className="max-h-full max-w-full object-contain" />
        </div>
      )
    case 'video':
      return <video src={publicUrl(node.source)} controls className="max-h-full max-w-full" />
    case 'pdf':
      return (
        <div ref={ref} className="w-full overflow-auto bg-[var(--window-bg-alt)] p-4">
          <Suspense fallback={<p className="p-6 text-secondary">Loading document…</p>}>
            <PdfPages url={publicUrl(node.source)} width={Math.max(240, Math.min(820, width - 32))} limit={pdfPages} />
          </Suspense>
        </div>
      )
    case 'md':
      return (
        <div className="selectable w-full overflow-auto px-10 py-8">
          <MdxDocument source={node.source} />
        </div>
      )
    default:
      return (
        <div className="grid h-full w-full place-items-center gap-2 p-10 text-center">
          <FileIcon node={node} size={128} />
          <p className="text-secondary">{kindLabel(node)}</p>
        </div>
      )
  }
}
