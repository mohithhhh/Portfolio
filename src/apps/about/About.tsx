'use client'
import { AboutContent } from './AboutContent'

export default function About() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto" data-drag-region>
      <AboutContent />
    </div>
  )
}
