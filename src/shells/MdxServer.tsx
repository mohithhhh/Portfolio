// Server-side MDX rendering for /simple and the deep-link pages.
import type { MDXComponents } from 'mdx/types'
import { mdxComponents } from '@/content/mdx-components'

// Inside a page section, a document's h1 becomes an h3 (and so on) so the
// page keeps a valid heading outline.
const demoted: MDXComponents = {
  h1: (p) => <h3 {...p} />,
  h2: (p) => <h4 {...p} />,
  h3: (p) => <h5 {...p} />,
}

export async function MdxServer({ source, demote = false }: { source: string; demote?: boolean }) {
  const rel = source.replace(/^content\//, '').replace(/\.mdx$/, '')
  const { default: Doc } = await import(`../../content/${rel}.mdx`)
  return (
    <article className="prose-doc">
      <Doc components={demote ? { ...mdxComponents, ...demoted } : mdxComponents} />
    </article>
  )
}
