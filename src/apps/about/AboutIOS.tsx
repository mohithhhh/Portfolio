'use client'
import { IOSNav } from '@/ui/IOSNav'
import { AboutContent } from './AboutContent'

export default function AboutIOS() {
  return (
    <div className="ios-screen">
      <IOSNav title="About" large />
      <div className="ios-scroll">
        <AboutContent compact />
      </div>
    </div>
  )
}
