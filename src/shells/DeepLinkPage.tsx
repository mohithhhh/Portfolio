import Link from 'next/link'
import { BootScreen } from './BootScreen'
import { MdxServer } from './MdxServer'
import { ShellLoader } from './ShellLoader'
import type { InitialAction } from './types'

/**
 * Deep link: real HTML for crawlers and link previews (visible without JS),
 * then the desktop boots with the item open in Finder and TextEdit.
 */
export function DeepLinkPage({ source, initial, meta }: { source: string; initial: InitialAction; meta: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="/simple">
        Skip to the accessible version
      </a>
      <noscript>
        <style>{'.boot{display:none}'}</style>
      </noscript>
      <div className="fallback">
        <p>
          <Link href="/">Mohith D K — Portfolio</Link> · <Link href="/simple">Simple version</Link>
        </p>
        <MdxServer source={source} />
        {meta}
      </div>
      <BootScreen />
      <ShellLoader initial={initial} />
    </>
  )
}
