'use client'
import { Download } from 'lucide-react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { IOSNav } from '@/ui/IOSNav'

const PdfPages = lazy(() => import('./PdfPages'))

export default function ResumeIOS() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(360)
  useEffect(() => {
    if (ref.current) setW(ref.current.clientWidth)
  }, [])
  return (
    <div className="ios-screen">
      <IOSNav
        title="Resume"
        right={
          <a className="ios-nav-action" href="/Resume.pdf" download="Mohith_D_K_Resume.pdf" aria-label="Download resume">
            <Download size={20} />
          </a>
        }
      />
      <div ref={ref} className="ios-preview bg-[var(--window-bg-alt)] p-3">
        <Suspense fallback={<p className="p-6 text-secondary">Loading…</p>}>
          <PdfPages url="/Resume.pdf" width={Math.max(280, w - 24)} />
        </Suspense>
      </div>
    </div>
  )
}
