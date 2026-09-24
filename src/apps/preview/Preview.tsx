'use client'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Download, PanelLeft, ZoomIn, ZoomOut } from 'lucide-react'
import { publicUrl } from '@/os/fs'
import type { AppProps } from '@/os/registry'
import { useWindows } from '@/os/stores/windows'
import { vfs } from '@/os/vfs'
import { Toolbar } from '@/ui/Toolbar'

const PdfPages = lazy(() => import('./PdfPages'))

function useElementWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export default function Preview({ win }: AppProps) {
  const node = win.payload?.nodeId ? vfs.byId.get(win.payload.nodeId) : undefined
  const setPayload = useWindows((s) => s.setPayload)
  const zoom = (win.payload?.zoom as number | undefined) ?? 1
  const thumbs = win.payload?.thumbnails !== false
  const [pages, setPages] = useState(0)
  const [activePage, setActivePage] = useState(0)
  const [mainRef, mainWidth] = useElementWidth()
  const pageEls = useRef<Array<HTMLDivElement | null>>([])

  const setZoom = (z: number) => setPayload(win.id, { zoom: Math.round(Math.min(3, Math.max(0.5, z)) * 100) / 100 })

  // The current page is the last one whose top has scrolled past 40% of the viewport.
  const onScroll = () => {
    const root = mainRef.current
    if (!root) return
    const line = root.scrollTop + root.clientHeight * 0.4
    let current = 0
    pageEls.current.forEach((el, i) => {
      if (el && el.offsetTop <= line) current = i
    })
    setActivePage(current)
  }

  if (!node || node.type !== 'file') {
    return <div className="grid flex-1 place-items-center text-secondary">No document open.</div>
  }
  const url = publicUrl(node.source)
  const isPdf = node.kind === 'pdf'
  const pageWidth = Math.max(240, (mainWidth - 64) * zoom)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar inset>
        {isPdf && (
          <button
            className="tb-btn"
            aria-label="Toggle thumbnails"
            aria-pressed={thumbs}
            onClick={() => setPayload(win.id, { thumbnails: !thumbs })}
          >
            <PanelLeft size={16} />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="toolbar-title m-0 leading-tight">{node.name}</h2>
          {isPdf && pages > 0 && (
            <p className="m-0 text-[11px] text-secondary">
              Page {activePage + 1} of {pages}
            </p>
          )}
        </div>
        <div className="toolbar-spacer" />
        <div className="tb-group" role="group" aria-label="Zoom">
          <button className="tb-btn" aria-label="Zoom out" disabled={zoom <= 0.5} onClick={() => setZoom(zoom - 0.25)}>
            <ZoomOut size={15} />
          </button>
          <span className="min-w-[42px] text-center text-[12px] text-secondary tabular-nums">{Math.round(zoom * 100)}%</span>
          <button className="tb-btn" aria-label="Zoom in" disabled={zoom >= 3} onClick={() => setZoom(zoom + 0.25)}>
            <ZoomIn size={15} />
          </button>
        </div>
        <a className="btn btn-primary" href={url} download={node.name} data-testid="preview-download">
          <Download size={14} /> Download
        </a>
      </Toolbar>
      <div className="flex min-h-0 flex-1">
        {isPdf && thumbs && (
          <aside className="preview-thumbs" aria-label="Page thumbnails">
            <Suspense fallback={null}>
              <PdfPages
                url={url}
                width={110}
                thumbnails
                activePage={activePage}
                onThumbClick={(i) => pageEls.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              />
            </Suspense>
          </aside>
        )}
        <div ref={mainRef} className="preview-main" data-testid="preview-main" onScroll={onScroll}>
          {isPdf ? (
            <Suspense fallback={<p className="p-6 text-secondary">Loading document…</p>}>
              <PdfPages
                url={url}
                width={pageWidth}
                onPages={setPages}
                pageRef={(i, el) => {
                  pageEls.current[i] = el
                }}
              />
            </Suspense>
          ) : (
            <img src={url} alt={node.name} style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? '100%' : 'none' }} className="m-auto block object-contain" />
          )}
        </div>
      </div>
    </div>
  )
}
