'use client'
// Lazy-loaded PDF renderer (react-pdf / pdf.js). Only loaded when a PDF is opened.
import './polyfills'
import { Suspense, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// The legacy worker supports browsers without the newest JS built-ins
// (e.g. Map.prototype.getOrInsertComputed, used by the modern build).
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()

type Props = {
  url: string
  width: number
  /** Render only the first N pages (Quick Look uses 1). */
  limit?: number
  onPages?: (n: number) => void
  pageRef?: (index: number, el: HTMLDivElement | null) => void
  thumbnails?: boolean
  onThumbClick?: (index: number) => void
  activePage?: number
}

export default function PdfPages({ url, width, limit, onPages, pageRef, thumbnails, onThumbClick, activePage }: Props) {
  const [numPages, setNumPages] = useState(0)
  const count = limit ? Math.min(limit, numPages) : numPages
  return (
    <Document
      file={url}
      onLoadSuccess={({ numPages: n }) => {
        setNumPages(n)
        onPages?.(n)
      }}
      loading={<p className="p-6 text-secondary">Loading document…</p>}
      error={<p className="p-6 text-secondary">Couldn’t open this PDF. Use Download to view it locally.</p>}
      className={thumbnails ? 'pdf-thumbs' : 'pdf-pages'}
    >
      {Array.from({ length: count }, (_, i) =>
        thumbnails ? (
          <button
            key={i}
            className="pdf-thumb"
            aria-label={`Page ${i + 1}`}
            aria-current={activePage === i ? 'page' : undefined}
            onClick={() => onThumbClick?.(i)}
          >
            <Suspense fallback={<div style={{ width, height: width * 1.29 }} />}>
              <Page pageNumber={i + 1} width={width} renderTextLayer={false} renderAnnotationLayer={false} />
            </Suspense>
            <span>{i + 1}</span>
          </button>
        ) : (
          <div key={i} ref={(el) => pageRef?.(i, el)} className="pdf-page" data-page={i}>
            <Suspense fallback={<div style={{ width, height: width * 1.29 }} />}>
              <Page pageNumber={i + 1} width={width} renderAnnotationLayer renderTextLayer />
            </Suspense>
          </div>
        ),
      )}
    </Document>
  )
}
