import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { experience, experienceBySlug, formatRange } from '@/content'
import { DeepLinkPage } from '@/shells/DeepLinkPage'

export const dynamicParams = false

export function generateStaticParams() {
  return experience.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = experienceBySlug(slug)
  if (!e) return {}
  const title = `${e.role} — ${e.company}`
  return {
    title,
    description: e.summary,
    alternates: { canonical: `/experience/${e.slug}` },
    openGraph: { title, description: e.summary, images: [{ url: `/og/${e.slug}`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description: e.summary, images: [`/og/${e.slug}`] },
  }
}

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = experienceBySlug(slug)
  if (!e) notFound()
  return (
    <DeepLinkPage
      source={`content/experience/${e.slug}.mdx`}
      initial={{ kind: 'experience', slug: e.slug }}
      meta={
        <p>
          {e.location} · {formatRange(e.start, e.end)}
        </p>
      }
    />
  )
}
