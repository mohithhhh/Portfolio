import { BootScreen } from '@/shells/BootScreen'
import { SemanticSummary } from '@/shells/SemanticSummary'
import { ShellLoader } from '@/shells/ShellLoader'
import { jsonLdScript, personJsonLd } from '@/site'

export default function Home() {
  return (
    <>
      <a className="skip-link" href="/simple">
        Skip to the accessible version
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd()) }} />
      <noscript>
        <style>{'.boot{display:none}'}</style>
      </noscript>
      <SemanticSummary />
      <BootScreen />
      <ShellLoader />
    </>
  )
}
