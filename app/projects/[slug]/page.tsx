import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { formatRange, projectBySlug, projects } from '@/content'
import { DeepLinkPage } from '@/shells/DeepLinkPage'

export const dynamicParams = false

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = projectBySlug(slug)
  if (!p) return {}
  return {
    title: p.name,
    description: p.summary,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: p.name, description: p.summary, images: [{ url: `/og/${p.slug}`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: p.name, description: p.summary, images: [`/og/${p.slug}`] },
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = projectBySlug(slug)
  if (!p) notFound()
  return (
    <DeepLinkPage
      source={`content/projects/${p.slug}.mdx`}
      initial={{ kind: 'project', slug: p.slug }}
      meta={
        <p>
          {formatRange(p.start, p.end)} · {p.tags.join(', ')}
        </p>
      }
    />
  )
}
