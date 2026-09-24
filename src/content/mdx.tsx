'use client'
// Loads an MDX document from content/ by its source path and renders it.
// The template-literal import lets the bundler code-split every document.
import { Suspense, use } from 'react'
import type { MDXContent } from 'mdx/types'
import { mdxComponents } from './mdx-components'

const cache = new Map<string, Promise<{ default: MDXContent }>>()

function load(source: string) {
  let p = cache.get(source)
  if (!p) {
    const rel = source.replace(/^content\//, '').replace(/\.mdx$/, '')
    p = import(`../../content/${rel}.mdx`) as Promise<{ default: MDXContent }>
    cache.set(source, p)
  }
  return p
}

function Doc({ source }: { source: string }) {
  const { default: Content } = use(load(source))
  return <Content components={mdxComponents} />
}

export function MdxDocument({ source, className }: { source: string; className?: string }) {
  return (
    <article className={`prose-doc ${className ?? ''}`}>
      <Suspense fallback={<p className="text-[var(--text-secondary)]">Loading…</p>}>
        <Doc source={source} />
      </Suspense>
    </article>
  )
}
